Cuando se encolan varias tareas offline y vuelve a modo online, funciona bien, suele pasar todas, pero algunas fallan, se repite generalmente la primera

Cuando se ejecutan varias tareas online una atras de la otra se hjacen demasiado rapido, en paralelo aparetenemente

Despues de algun error, se siguen procesando request a veces, no deberia ser asi

Si interrrumpis internet cuando se estan procesando operaciones encoladas es para cagada

Las operaciones de actualizacion deben en realidad deberian estar a cargo de la UI, no de QueueStore.
Solamente para el caso de que exista una unica operacion de actualizacion de datos sera posible disparar una sincronizacion desde dentro de la store...mejor desde la UI

Si existe un error, la store se actualizara
