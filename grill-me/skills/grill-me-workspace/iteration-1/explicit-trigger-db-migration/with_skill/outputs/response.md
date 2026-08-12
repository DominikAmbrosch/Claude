Gut, dann grillen wir den Plan. Bevor ich in die technischen Details (Replikationsmethode, Tooling, Cutover-Strategie) einsteige, brauche ich zuerst die Grundsatzfrage, weil sie fast alles andere im Entscheidungsbaum bestimmt:

**Was ist der primäre Treiber für die Multi-Region-Replikation?**

- (a) Disaster Recovery / Ausfallsicherheit – Failover, falls eine ganze Region ausfällt
- (b) Lese-Latenz – Nutzer in anderen Regionen sollen schneller lesen können (Read-Replicas nah am Nutzer)
- (c) Compliance / Data Residency – bestimmte Daten müssen rechtlich in bestimmten Regionen liegen
- (d) Mehrere der obigen gleichzeitig

**Meine Empfehlung:** Ich würde erstmal von (a) Disaster Recovery ausgehen, kombiniert mit (b) als Nebeneffekt. Begründung: Das lässt sich mit klassischer asynchroner Streaming-Replikation (ein Primary, Read-Replicas in anderen Regionen) lösen – deutlich risikoärmer und in einem Monat realistisch umsetzbar. Falls ihr dagegen aktives Schreiben in mehreren Regionen braucht (Multi-Primary / Conflict Resolution), wird der Plan ungleich komplexer, und "nächsten Monat, ohne Downtime" wird sehr eng.

Was ist bei euch der Haupttreiber – und ist es einer oder eine Kombination?
