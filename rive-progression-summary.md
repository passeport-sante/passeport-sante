# 🎮 Rive — Animation Progression de Niveaux (Site Prévention Santé)

## 📁 Fichier Rive

- **Nom** : `Untitled` (à renommer en `GameProgress`)
- **URL** : `https://editor.rive.app/file/untitled/2228241`
- **Artboard** : `GameProgress`

---

## ✅ Ce qui a été fait

### Structure de la scène

- `character` — mascotte (image node, scale 50%)
- `step1` à `step5` — les 5 cercles de niveaux
  - step1 : X 75.5 / Y 253.5
  - step2 : X 228.5 / Y 170
  - step3 : X 395.5 / Y 253.5
  - step4 : X 547.5 / Y 170
  - step5 : X 709 / Y 253.5
- `lock1` à `lock4` — cadenas sur les niveaux 2 à 5
- `stars_1_2`, `stars_2_3`, `stars_3_4`, `stars_4_5` — groupes d'étoiles entre chaque niveau (6 étoiles chacun avec un `Path` fill)
- `GameProgressController` — node script (créé par l'Agent Rive)

### ViewModel (Data panel)

Toutes ces propriétés sont créées et bindées :

- `characterX` / `characterY` — position de la mascotte (bindées à character.x / character.y)
- `lock2Opacity` à `lock5Opacity` — opacité des cadenas
- `star_g1_s1` à `star_g4_s6` — couleur de chaque étoile (24 propriétés Color)
- `level` — Number (valeur 1 à 5)

### Script Lua — GameProgressController

Logique complète implémentée :

- **Jump tween** : mascotte se déplace avec arc parabolique de step N vers step N+1 (durée 0.55s, arc 80px)
- **Stars stagger** : étoiles s'illuminent en jaune (#FFD700) une par une avec 80ms de délai
- **Lock fade** : cadenas disparaissent en fondu (vitesse 3.0/sec)
- `syncInitialState()` : place la mascotte et initialise l'état au démarrage
- `handleLevelChange()` : réagit quand `level` change
- Listener sur `levelProp` via ViewModel

### State Machine

- **State Machine 1** existe avec ses états
- Inputs (deprecated) présents

### Bugs corrigés

- ✅ Star 4 dans `stars_3_4` avait couleur hardcodée `E8B138` — corrigée en `747474` et bindée à `star_g3_s4`
- ✅ Toutes les étoiles grises au démarrage

---

## ⚠️ Ce qui reste à finir

### 1. Position initiale de la mascotte

- `characterX` default = 67 et `characterY` default = 148 au lieu de 75.5 / 161.25
- **Fix** : Dans **Data** → `characterX` mettre **75.5** / `characterY` mettre **161.25** / `level` mettre **1**

### 2. Attacher le script au nœud GameProgressController

- Le script `GameProgressController` existe dans Assets mais n'est pas encore attaché à son nœud
- **Fix** : Aller dans **Assets → Scripts** → glisser `GameProgressController` sur le canvas
- Cela crée automatiquement le nœud script lié

### 3. Tester les transitions level 1→2→3→4→5

- Aller dans **Data** → changer `level` de 1 à 2, 3, 4, 5
- Vérifier : mascotte saute ✓ / étoiles s'illuminent ✓ / cadenas disparaissent ✓

### 4. Exporter le fichier .riv

- Cliquer sur **Publish** en haut à droite
- Télécharger le fichier `.riv`

### 5. Intégrer dans le site web (prévention santé)

Ajouter le runtime Rive dans le HTML :

```html
<canvas id="rive-canvas" width="800" height="400"></canvas>
<script src="https://unpkg.com/@rive-app/canvas@latest/rive.js"></script>
<script>
  const r = new rive.Rive({
    src: "gameprogress.riv",
    canvas: document.getElementById("rive-canvas"),
    autoplay: true,
    stateMachines: "State Machine 1",
    onLoad: () => {
      // Contrôler la progression depuis JS
      const vm = r.getTextRunValue; // via ViewModel
    },
  });

  // Pour changer le niveau depuis ton site :
  function setLevel(n) {
    const inputs = r.stateMachineInputs("State Machine 1");
    // ou via ViewModel selon l'implémentation finale
  }
</script>
```

### 6. Connecter au vrai parcours utilisateur

- Définir les 5 étapes du parcours santé (ex: "Je m'informe" / "Je prends RDV" / etc.)
- Déclencher `setLevel(n)` au clic sur un bouton "Étape suivante"
- Optionnel : sauvegarder la progression en localStorage

---

## 🔧 Stack technique

- **Rive** : version BETA 0.8.4630
- **Script** : Lua typé (Rive scripting beta)
- **Runtime web** : @rive-app/canvas (JS)
- **ViewModel** : pattern data-binding Rive

---

## 📌 Notes importantes

- L'Agent IA de Rive (crédits épuisés) a généré la majorité du script et des bindings
- Le script utilise le **ViewModel** (pas les Inputs State Machine deprecated) pour communiquer
- `character` est un **Image node** (pas un Group ni Artboard imbriqué)
- Les animations jump1-jump4 existantes ne sont pas utilisées — le script fait un tween direct sur X/Y
