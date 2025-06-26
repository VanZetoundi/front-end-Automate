require 'matrix'

# Fonction pour calculer la norme d'un vecteur
# @param vector [Vector] Vecteur d'entrée
# @return [Float] Norme euclidienne
def norm(vector)
  Math.sqrt(vector.inject(0) { |sum, x| sum + x**2 })
end

# Gradient numérique d'une fonction (approximation par différence finie)
# @param f [Proc] Fonction objectif
# @param x [Vector] Point où calculer le gradient
# @param h [Float] Pas pour la différence finie
# @return [Vector] Gradient approximé
def numerical_gradient(f, x, h = 1e-6)
  n = x.size
  grad = Array.new(n)
  n.times do |i|
    x_plus = x.to_a
    x_minus = x.to_a
    x_plus[i] += h
    x_minus[i] -= h
    grad[i] = (f.call(Vector[*x_plus]) - f.call(Vector[*x_minus])) / (2 * h)
  end
  Vector[*grad]
end

# Résout le sous-problème de région de confiance : min_s ∇f^T s + (1/2) s^T B s, ||s|| ≤ Δ
# Utilise une approximation simple via le gradient et la projection
# @param grad [Vector] Gradient ∇f
# @param b [Matrix] Approximation du Hessien B
# @param delta [Float] Rayon de confiance Δ
# @return [Vector] Solution s
def solve_trust_region_subproblem(grad, b, delta)
  # Vérifie si B est définie positive
  begin
    cholesky = b.cholesky
    positive_definite = true
  rescue
    positive_definite = false
  end

  if positive_definite
    # Si B est définie positive, résout B s = -∇f
    s = -b.inverse * grad
    if norm(s) <= delta
      return s
    end
  end

  # Sinon, ou si ||s|| > Δ, utilise la direction de descente -∇f et projette
  s = -grad
  s_norm = norm(s)
  if s_norm > delta
    s = s * (delta / s_norm)
  end
  s
end

# Méthode Quasi-Newton SR1
# @param f [Proc] Fonction objectif
# @param x0 [Vector] Point initial
# @param epsilon [Float] Tolérance pour ||∇f||
# @param b0 [Matrix] Approximation initiale du Hessien
# @param delta0 [Float] Rayon de confiance initial
# @param eta [Float] Paramètre pour accepter la réduction
# @param r [Float] Paramètre pour la mise à jour SR1
# @return [Hash] Résultat avec point optimal, valeur de f, gradient, et itérations
def quasi_newton_sr1(f, x0, epsilon, b0, delta0, eta = 1e-4, r = 0.1)
  # Initialisation
  k = 0
  xk = x0
  bk = b0
  delta_k = delta0
  max_iterations = 1000 # Limite pour éviter les boucles infinies

  # Journalisation initiale
  puts "Itération #{k}: xk = #{xk.to_a}, f(xk) = #{f.call(xk)}, ||∇f|| = #{norm(numerical_gradient(f, xk))}"

  # Boucle principale
  while k < max_iterations
    grad_k = numerical_gradient(f, xk)
    grad_norm = norm(grad_k)

    # Condition d'arrêt
    break if grad_norm <= epsilon

    # Étape 3: Résoudre le sous-problème de région de confiance
    sk = solve_trust_region_subproblem(grad_k, bk, delta_k)

    # Étape 6: Calculer yk = ∇f(xk + sk) - ∇f(xk)
    xk_plus_sk = xk + sk
    yk = numerical_gradient(f, xk_plus_sk) - grad_k

    # Étape 7: Calculer la réduction actuelle (ared)
    fk = f.call(xk)
    fk_plus_sk = f.call(xk_plus_sk)
    ared = fk - fk_plus_sk

    # Étape 8: Calculer la réduction prédite (pred)
    pred = -(grad_k.inner_product(sk) + 0.5 * (sk.inner_product(bk * sk)))

    # Étape 9-12: Mise à jour de xk
    if ared / pred > eta
      xk_next = xk_plus_sk
    else
      xk_next = xk
    end

    # Étape 13-20: Mise à jour du rayon de confiance Δk
    if ared / pred > 0.75
      if norm(sk) <= 0.8 * delta_k
        delta_k_next = delta_k
      else
        delta_k_next = 2 * delta_k
      end
    elsif ared / pred >= 0.1
      delta_k_next = delta_k
    else
      delta_k_next = delta_k * 0.5 # Réduction si faible amélioration
    end

    # Étape 21-24: Mise à jour SR1 de Bk
    bk_sk = bk * sk
    yk_minus_bk_sk = yk - bk_sk
    denominator = yk_minus_bk_sk.inner_product(sk)
    if (sk.inner_product(yk_minus_bk_sk).abs >= r * norm(sk) * norm(yk_minus_bk_sk)) && denominator != 0
      # Mise à jour SR1: Bk+1 = Bk + (yk - Bk sk)(yk - Bk sk)^T / ((yk - Bk sk)^T sk)
      outer_product = yk_minus_bk_sk.to_a.map { |yi| yk_minus_bk_sk.to_a.map { |yj| yi * yj } }
      bk_next = bk + (Matrix[*outer_product] * (1.0 / denominator))
    else
      bk_next = bk
    end

    # Étape 25: Préparer l'itération suivante
    xk = xk_next
    bk = bk_next
    delta_k = delta_k_next
    k += 1

    # Journalisation
    puts "Itération #{k}: xk = #{xk.to_a}, f(xk) = #{f.call(xk)}, ||∇f|| = #{grad_norm}, Δk = #{delta_k}"
  end

  # Résultat final
  {
    x: xk,
    f_value: f.call(xk),
    gradient_norm: norm(numerical_gradient(f, xk)),
    iterations: k
  }
end

# Test de la méthode SR1
if __FILE__ == $PROGRAM_NAME
  # Fonction test : f(x) = x1^2 + x2^2 (minimum en [0, 0])
  f = proc { |x| x[0]**2 + x[1]**2 }

  # Initialisation
  n = 2 # Dimension
  x0 = Vector[*Array.new(n) { rand(-5.0..5.0) }] # Point initial aléatoire
  epsilon = 1e-6 # Tolérance
  b0 = Matrix.identity(n) # Hessien initial = identité
  delta0 = 1.0 # Rayon de confiance initial

  puts "Test de la méthode Quasi-Newton SR1"
  puts "Fonction: f(x) = x1^2 + x2^2"
  puts "Point initial: #{x0.to_a}"
  puts "Tolérance: #{epsilon}"
  puts "Hessien initial: \n#{b0.to_a.map { |row| row.join(' ') }.join("\n")}"

  # Exécuter la méthode
  result = quasi_newton_sr1(f, x0, epsilon, b0, delta0)

  # Afficher les résultats
  puts "\nRésultats:"
  puts "Point optimal: #{result[:x].to_a}"
  puts "Valeur de f: #{result[:f_value]}"
  puts "Norme du gradient: #{result[:gradient_norm]}"
  puts "Nombre d'itérations: #{result[:iterations]}"
end