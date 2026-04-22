# URL Shortener

Proyecto web construido con Next.js para acortar URLs desde una interfaz sencilla, guardar la relacion entre el enlace original y el slug generado, y consultar el historial reciente desde el navegador.

## Que hace el proyecto

La aplicacion permite:

- ingresar una URL valida desde la interfaz principal
- enviar esa URL al endpoint interno `/api/shorten`
- generar un slug aleatorio seguro en el servidor
- guardar el slug y la URL original en Upstash Redis
- mostrar el resultado al usuario
- conservar un historial local en el navegador para la sesion del usuario
- aplicar rate limit por IP en la API de acortado

## Como funciona

El flujo principal es este:

1. El usuario escribe una URL en la pagina principal.
2. El formulario envia la URL a `app/api/shorten/route.ts`.
3. La API valida y normaliza el dato recibido.
4. La API aplica rate limit por IP.
5. La API genera un slug aleatorio y lo guarda de forma atomica en Upstash.
6. La API responde al frontend con la URL corta resultante.
7. El frontend agrega ese registro al historial local guardado en `localStorage`.

## Persistencia y almacenamiento

El proyecto usa dos niveles de almacenamiento:

- Upstash Redis para persistencia en servidor
- `localStorage` del navegador para historial visual del usuario

La persistencia del servidor se implementa en `lib/store.ts` y se usa desde la API para guardar y consultar slugs.

## Rutas importantes

- `app/page.tsx`
  Pagina principal con formulario, metricas e historial local.
- `app/api/shorten/route.ts`
  Endpoint que valida la URL, aplica rate limit, genera slug y guarda el resultado en Upstash.
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
APP_BASE_URL="https://tu-dominio.com"
LINK_TTL_SECONDS="0"
SHORTEN_RATE_LIMIT_MAX="20"
SHORTEN_RATE_LIMIT_WINDOW_SECONDS="60"
```

### Significado de cada variable

- `UPSTASH_REDIS_REST_URL`
  URL REST de la base de datos en Upstash.
- `UPSTASH_REDIS_REST_TOKEN`
  Token de acceso REST para Upstash.
- `ALLOW_INSECURE_SHORTENER_TLS`
  Permite conexiones TLS relajadas solo para entornos locales con certificados corporativos o inspeccion HTTPS.
- `APP_BASE_URL`
  Dominio publico base usado para construir los enlaces cortos. Si no se define, se usa el `origin` de la request.
- `LINK_TTL_SECONDS`
  TTL de los enlaces en segundos. Usa `0` para sin expiracion.
- `SHORTEN_RATE_LIMIT_MAX`
  Cantidad maxima de solicitudes por ventana para `/api/shorten`.
- `SHORTEN_RATE_LIMIT_WINDOW_SECONDS`
  Duracion de la ventana de rate limit en segundos.

## Requisitos de red

Para que el flujo funcione correctamente, la maquina que ejecuta el servidor debe tener acceso de salida a:

- tu dominio de Upstash, por ejemplo `*.upstash.io`

Si la red corporativa bloquea ese dominio, la API no podra completar la persistencia.

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

## Estado funcional esperado

Cuando todo esta correctamente configurado:

- el usuario envia una URL
- recibe una URL corta generada por el servidor
- el slug queda almacenado en Upstash
- el frontend muestra el resultado y lo agrega al historial local
- el endpoint aplica rate limit basico para reducir abuso
