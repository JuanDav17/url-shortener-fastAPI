# URL Shortener

Proyecto web construido con Next.js para acortar URLs desde una interfaz sencilla, guardar la relacion entre el enlace original y el slug generado, y consultar el historial reciente desde el navegador.

## Que hace el proyecto

La aplicacion permite:

- ingresar una URL valida desde la interfaz principal
- enviar esa URL al endpoint interno `/api/shorten`
- solicitar el acortado al proveedor `is.gd`
- guardar el slug y la URL original en Upstash Redis
- mostrar el resultado al usuario
- conservar un historial local en el navegador para la sesion del usuario

## Como funciona

El flujo principal es este:

1. El usuario escribe una URL en la pagina principal.
2. El formulario envia la URL a `app/api/shorten/route.ts`.
3. La API valida el dato recibido.
4. La API hace la solicitud a `is.gd` para generar el enlace corto.
5. Cuando `is.gd` responde correctamente, se extrae el slug del enlace corto.
6. Ese slug se guarda junto con la URL original en Upstash Redis.
7. La API responde al frontend con la URL corta resultante.
8. El frontend agrega ese registro al historial local guardado en `localStorage`.

## Persistencia y almacenamiento

El proyecto usa dos niveles de almacenamiento:

- Upstash Redis para persistencia en servidor
- `localStorage` del navegador para historial visual del usuario

La persistencia del servidor se implementa en `lib/store.ts` y se usa desde la API para guardar y consultar slugs.

## Rutas importantes

- `app/page.tsx`
  Pagina principal con formulario, metricas e historial local.
- `app/api/shorten/route.ts`
  Endpoint que valida la URL, consulta `is.gd` y guarda el resultado en Upstash.
- `app/[slug]/page.tsx`
  Ruta dinamica que busca el slug en Upstash y redirige a la URL original.
- `lib/store.ts`
  Capa de acceso a Upstash Redis.
- `components/ui/*`
  Componentes de interfaz como formulario, listado, toast y botones.

## Variables de entorno

El proyecto necesita un archivo `.env` con estas variables:

```env
UPSTASH_REDIS_REST_URL="https://tu-instancia.upstash.io"
UPSTASH_REDIS_REST_TOKEN="tu-token"
ALLOW_INSECURE_SHORTENER_TLS="false"
```

### Significado de cada variable

- `UPSTASH_REDIS_REST_URL`
  URL REST de la base de datos en Upstash.
- `UPSTASH_REDIS_REST_TOKEN`
  Token de acceso REST para Upstash.
- `ALLOW_INSECURE_SHORTENER_TLS`
  Permite conexiones TLS relajadas solo para entornos locales con certificados corporativos o inspeccion HTTPS.

## Requisitos de red

Para que el flujo funcione correctamente, la maquina que ejecuta el servidor debe tener acceso de salida a:

- `is.gd`
- tu dominio de Upstash, por ejemplo `*.upstash.io`

Si la red corporativa bloquea esos dominios, la API no podra completar el acortado ni la persistencia.

## Ejecutar el proyecto

Instala dependencias y levanta el servidor de desarrollo:

```bash
npm install
npm run dev
```

Luego abre:

```text
http://localhost:3000
```

## Tecnologias usadas

- Next.js 15
- React 19
- TypeScript
- Upstash Redis
- is.gd como proveedor de acortado

## Estado funcional esperado

Cuando todo esta correctamente configurado:

- el usuario envia una URL
- recibe una URL corta generada por `is.gd`
- el slug queda almacenado en Upstash
- el frontend muestra el resultado y lo agrega al historial local

## Nota

El `README` describe el funcionamiento actual del proyecto segun el codigo existente del repositorio.
