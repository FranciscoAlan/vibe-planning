# Variables de entorno de la API

Esta guía centraliza el inventario de variables que la API lee o que aparecen en sus archivos de entorno. Doppler es la fuente operativa de secretos; `apps/api/.env.example` es solo una plantilla sin credenciales funcionales.

## Entornos Doppler

Usar el proyecto `vibe-planners` con configuraciones independientes:

| Configuración | Uso                                                                                 | Acceso                                        |
| ------------- | ----------------------------------------------------------------------------------- | --------------------------------------------- |
| `dev`         | Desarrollo local. Usar servicios y credenciales de desarrollo.                      | Desarrolladores autorizados.                  |
| `qa`          | Validación previa a producción. Usar recursos y credenciales de QA.                 | Equipo de QA y operadores que lo requieran.   |
| `prod`        | Ejecución de producción. Usar exclusivamente recursos y credenciales de producción. | Operadores autorizados con mínimo privilegio. |

No copiar valores de `prod` a `qa` o `dev`. Crear y administrar estos recursos y permisos en Doppler es una tarea operativa; esta guía no contiene ni provisiona valores secretos.

## Instalar y ejecutar con Doppler

En Windows, instalar el CLI desde una terminal:

```powershell
winget install Doppler.doppler
doppler --version
```

Autenticarse con la cuenta autorizada:

```powershell
doppler login
```

Ejecutar los comandos desde `apps/api`. Seleccionar el proyecto y la configuración en cada ejecución para evitar depender de una selección local previa:

```powershell
Set-Location apps/api

# Desarrollo local
doppler run --project vibe-planners --config dev -- npm run start:dev

# Validación de QA
doppler run --project vibe-planners --config qa -- npm run start

# Arranque de producción, normalmente ejecutado por el operador autorizado
doppler run --project vibe-planners --config prod -- npm run start:prod
```

Usar `prod` únicamente en el entorno de producción y con una identidad autorizada. No imprimir secretos para comprobar que están disponibles. La API los recibe como variables de entorno del proceso.

## Inventario

El estado de uso se basa en las referencias actuales de `apps/api/src`; “no referenciada” significa que no se encontró una lectura directa en ese código y no debe interpretarse como una dependencia activa de la API. Los requisitos de proveedor indicados como condicionales aplican cuando se usa esa integración.

| Variable                        | Propósito                                                          | Sensibilidad                                                   | Requisito o comportamiento actual                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                  | Conexión de PostgreSQL para Prisma.                                | Secreto: puede contener usuario y contraseña.                  | Requerida; Prisma lanza un error si falta.                                                                                                                               |
| `PORT`                          | Puerto HTTP de la API.                                             | Configuración.                                                 | Opcional; predeterminado `3000`.                                                                                                                                         |
| `NODE_ENV`                      | Indicador de entorno incluido en la plantilla.                     | Configuración.                                                 | No se lee directamente en `apps/api/src`; no se considera requisito de inicio confirmado por el código actual.                                                           |
| `REDIS_URL`                     | URL de conexión a Redis declarada en la plantilla.                 | Secreto si contiene credenciales; de otro modo, configuración. | No se lee directamente en `apps/api/src`; no se considera requisito de inicio confirmado por el código actual.                                                           |
| `BOOKING_DEFAULT_HOLD_HOURS`    | Duración predeterminada de retención de una reservación, en horas. | Configuración.                                                 | Opcional; predeterminado `24`. Si está definido, debe ser un entero positivo o la operación que lo evalúe falla.                                                         |
| `JWT_SECRET`                    | Firma y validación de JWT de identidad.                            | Secreto crítico.                                               | El código tiene el fallback `dev-only-placeholder-secret`; configurar un valor fuerte, exclusivo del entorno y administrado por Doppler, especialmente en `qa` y `prod`. |
| `JWT_EXPIRES_IN`                | Duración de JWT, en el formato admitido por la aplicación.         | Configuración.                                                 | Opcional; predeterminado `15m`.                                                                                                                                          |
| `IDENTITY_REFRESH_TTL_DAYS`     | Vigencia de refresh tokens, en días.                               | Configuración.                                                 | Opcional; predeterminado `30`.                                                                                                                                           |
| `IDENTITY_2FA_ENCRYPTION_KEY`   | Clave AES-256-GCM para cifrar y descifrar secretos TOTP.           | Secreto crítico.                                               | Necesaria al cifrar o descifrar; debe ser una clave de 32 bytes codificada en Base64. No tiene fallback.                                                                 |
| `IDENTITY_PHONE_TTL_MINUTES`    | Vigencia de desafíos de teléfono.                                  | Configuración.                                                 | Opcional; predeterminado `10` minutos.                                                                                                                                   |
| `IDENTITY_PHONE_MAX_ATTEMPTS`   | Intentos máximos para verificar desafíos de teléfono.              | Configuración.                                                 | Opcional; predeterminado `5`.                                                                                                                                            |
| `IDENTITY_PHONE_RESEND_SECONDS` | Espera entre solicitudes de desafíos de teléfono.                  | Configuración.                                                 | Opcional; predeterminado `60` segundos.                                                                                                                                  |
| `IDENTITY_EMAIL_TTL_MINUTES`    | Vigencia de desafíos de email.                                     | Configuración.                                                 | Opcional; predeterminado `15` minutos.                                                                                                                                   |
| `IDENTITY_EMAIL_MAX_ATTEMPTS`   | Intentos máximos para verificar desafíos de email.                 | Configuración.                                                 | Opcional; predeterminado `5`.                                                                                                                                            |
| `IDENTITY_EMAIL_RESEND_SECONDS` | Espera entre solicitudes de desafíos de email.                     | Configuración.                                                 | Opcional; predeterminado `60` segundos.                                                                                                                                  |
| `GOOGLE_CLIENT_ID`              | Identificador OAuth de Google.                                     | Identificador de aplicación, no secreto.                       | La estrategia usa `placeholder` si falta; configurar el identificador real para habilitar OAuth.                                                                         |
| `GOOGLE_CLIENT_SECRET`          | Secreto OAuth de Google.                                           | Secreto.                                                       | La estrategia usa `placeholder` si falta; configurar el secreto real para habilitar OAuth.                                                                               |
| `GOOGLE_CALLBACK_URL`           | URL de retorno OAuth de Google.                                    | Configuración.                                                 | Opcional; predeterminado `http://localhost:3000/identity/google/callback`.                                                                                               |
| `FACEBOOK_APP_ID`               | Identificador OAuth de Facebook.                                   | Identificador de aplicación, no secreto.                       | La estrategia usa `placeholder` si falta; configurar el identificador real para habilitar OAuth.                                                                         |
| `FACEBOOK_APP_SECRET`           | Secreto OAuth de Facebook.                                         | Secreto.                                                       | La estrategia usa `placeholder` si falta; configurar el secreto real para habilitar OAuth.                                                                               |
| `FACEBOOK_CALLBACK_URL`         | URL de retorno OAuth de Facebook.                                  | Configuración.                                                 | Opcional; predeterminado `http://localhost:3000/identity/facebook/callback`.                                                                                             |
| `ELASTICSEARCH_NODE`            | URL del nodo Elasticsearch.                                        | Configuración; tratar como sensible si incorpora credenciales. | Leída por el cliente, pero la implementación base de proveedores aún no está implementada; no es un requisito de inicio confirmado.                                      |
| `ELASTICSEARCH_USERNAME`        | Usuario de Elasticsearch.                                          | Credencial.                                                    | Leída por el cliente, pero la implementación base de proveedores aún no está implementada; no es un requisito de inicio confirmado.                                      |
| `ELASTICSEARCH_PASSWORD`        | Contraseña de Elasticsearch.                                       | Secreto.                                                       | Leída por el cliente, pero la implementación base de proveedores aún no está implementada; no es un requisito de inicio confirmado.                                      |
| `ELASTICSEARCH_API_KEY`         | Clave API de Elasticsearch listada en la plantilla.                | Secreto.                                                       | No se encontró referencia en `apps/api/src`; confirmar su uso antes de tratarla como activa.                                                                             |
| `STRIPE_SECRET_KEY`             | Clave secreta de Stripe.                                           | Secreto crítico.                                               | Leída por el cliente, pero la implementación base de proveedores aún no está implementada; no es un requisito de inicio confirmado.                                      |
| `TWILIO_ACCOUNT_SID`            | Identificador de cuenta Twilio para SMS.                           | Identificador de cuenta.                                       | Requerida para enviar SMS.                                                                                                                                               |
| `TWILIO_AUTH_TOKEN`             | Token de autenticación de Twilio.                                  | Secreto crítico.                                               | Requerido para enviar SMS.                                                                                                                                               |
| `TWILIO_FROM_NUMBER`            | Número remitente de Twilio.                                        | Configuración.                                                 | Requerido para enviar SMS.                                                                                                                                               |
| `TWILIO_CLIENT_SECRET`          | Variable listada en la plantilla y el README.                      | Secreto.                                                       | No se encontró referencia en `apps/api/src`; no confundir con `TWILIO_AUTH_TOKEN`, que es el valor leído por el cliente.                                                 |
| `RESEND_API_KEY`                | Clave API de Resend para correo.                                   | Secreto crítico.                                               | Requerida para enviar correo.                                                                                                                                            |
| `RESEND_FROM_EMAIL`             | Remitente de correo verificado en Resend.                          | Configuración.                                                 | Requerida para enviar correo.                                                                                                                                            |
| `FIREBASE_PROJECT_ID`           | Identificador del proyecto Firebase.                               | Identificador de recurso.                                      | Leída por el cliente, pero la implementación base de proveedores aún no está implementada; no es un requisito de inicio confirmado.                                      |
| `FIREBASE_CLIENT_EMAIL`         | Identidad de servicio de Firebase.                                 | Identidad de servicio.                                         | Leída por el cliente, pero la implementación base de proveedores aún no está implementada; no es un requisito de inicio confirmado.                                      |
| `FIREBASE_PRIVATE_KEY`          | Clave privada de la identidad de servicio Firebase.                | Secreto crítico.                                               | Leída por el cliente, pero la implementación base de proveedores aún no está implementada; no es un requisito de inicio confirmado.                                      |
| `CLOUDINARY_CLOUD_NAME`         | Nombre de nube de Cloudinary.                                      | Identificador de recurso.                                      | Leída por el cliente, pero la implementación base de proveedores aún no está implementada; no es un requisito de inicio confirmado.                                      |
| `CLOUDINARY_API_KEY`            | Identificador de API de Cloudinary.                                | Credencial.                                                    | Leída por el cliente, pero la implementación base de proveedores aún no está implementada; no es un requisito de inicio confirmado.                                      |
| `CLOUDINARY_API_SECRET`         | Secreto API de Cloudinary.                                         | Secreto crítico.                                               | Leída por el cliente, pero la implementación base de proveedores aún no está implementada; no es un requisito de inicio confirmado.                                      |

El README anterior omitía `ELASTICSEARCH_API_KEY` y la plantilla omitía `ELASTICSEARCH_USERNAME` y `ELASTICSEARCH_PASSWORD`. `NODE_ENV`, `REDIS_URL` y `TWILIO_CLIENT_SECRET` aparecen en la plantilla, pero no tienen lecturas directas en `apps/api/src`. Mantener estas discrepancias visibles hasta reconciliar la plantilla y el README en los pasos siguientes.

## Respaldo y recuperación manual

Realizar un respaldo por configuración (`dev`, `qa` y `prod`) antes de cambiar o rotar sus secretos. Los archivos `.age` se guardan en almacenamiento externo aprobado por la organización, fuera del repositorio. Nunca guardar el JSON descifrado, la identidad privada de `age` ni copias locales de las exportaciones en el repositorio.

El procedimiento requiere Doppler CLI autenticado, `age`, `jq` y WSL para usar las tuberías y la sustitución de proceso mostradas abajo con herramientas Linux compatibles. Antes de empezar, definir `AGE_IDENTITY_FILE` como la ruta externa de la identidad privada, `AGE_RECIPIENT` como su destinatario público y `BACKUP_DIR` como una ubicación de respaldo aprobada fuera del checkout. El destinatario público no es secreto.

### Preparar la identidad de cifrado

Generar una identidad `age` una sola vez en una ubicación segura, custodiar la parte privada mediante el mecanismo aprobado por la organización y conservar el destinatario público para futuros respaldos:

```bash
age-keygen -o "$AGE_IDENTITY_FILE"
age-keygen -y "$AGE_IDENTITY_FILE"
```

No regenerar ni descartar la identidad privada mientras existan respaldos cifrados con su destinatario. Protegerla con controles de acceso del sistema y el proceso organizacional de recuperación de claves.

### Exportar y cifrar

Definir `BACKUP_DIR` como la ruta externa aprobada y `AGE_RECIPIENT` como el destinatario público correspondiente. Ejecutar lo siguiente para cada configuración, cambiando `CONFIG` a `dev`, `qa` y `prod`:

```bash
set +x
set -euo pipefail
umask 077

CONFIG=dev
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP_FILE="$BACKUP_DIR/vibe-planners-${CONFIG}-${TIMESTAMP}.json.age"

doppler --silent secrets download \
  --project vibe-planners \
  --config "$CONFIG" \
  --no-file \
  --format json |
  age --recipient "$AGE_RECIPIENT" --output "$BACKUP_FILE"
```

`--no-file` envía el JSON de Doppler por la tubería, sin crear un archivo de exportación en claro. No añadir `tee`, redirecciones a archivos sin cifrar ni opciones de trazado de comandos. Si falla cualquiera de los comandos, no considerar válido ese respaldo. Usar un nombre nuevo con marca UTC para cada exportación y no sobrescribir copias previas.

Validar que el archivo puede descifrarse y que contiene un objeto JSON sin mostrar sus valores:

```bash
age --decrypt --identity "$AGE_IDENTITY_FILE" "$BACKUP_FILE" |
  jq -e 'type == "object" and length > 0' >/dev/null
```

Un código de salida distinto de cero invalida la verificación. Conservar el archivo cifrado en el almacenamiento aprobado y limitar su acceso conforme a la política organizacional.

### Verificar una restauración aislada

Un operador autorizado debe preparar una configuración Doppler temporal de recuperación, sin consumidores ni despliegues activos, con acceso restringido y sin heredar ni sobrescribir configuraciones `dev`, `qa` o `prod`. Restaurar el respaldo en esa configuración, nunca en la configuración de origen:

```bash
RECOVERY_CONFIG=recovery-test

doppler --silent secrets upload \
  --project vibe-planners \
  --config "$RECOVERY_CONFIG" \
  <(age --decrypt --identity "$AGE_IDENTITY_FILE" "$BACKUP_FILE")
```

Comparar en memoria la configuración restaurada con el respaldo, ordenando las claves JSON y sin imprimir valores:

```bash
cmp \
  <(doppler --silent secrets download \
      --project vibe-planners \
      --config "$RECOVERY_CONFIG" \
      --no-file \
      --format json | jq -S .) \
  <(age --decrypt --identity "$AGE_IDENTITY_FILE" "$BACKUP_FILE" | jq -S .)
```

La verificación pasa solo si `cmp` termina con código `0`. Si falla el descifrado, la carga o la comparación, detener la recuperación y resolver el error antes de confiar en el respaldo. Mantener la configuración de prueba aislada y retirar sus valores y acceso según el proceso aprobado al terminar la verificación.

No pegar secretos en terminales compartidas, tickets, chats ni logs. No activar transcripción de shell ni `set -x` durante la exportación, descifrado o restauración. Las tuberías anteriores mantienen el contenido en memoria y no requieren guardar texto claro en disco.

## Referencias Doppler

- [Guía del CLI Doppler](https://docs.doppler.com/docs/cli)
- [Instalación y configuración local del CLI Doppler](https://docs.doppler.com/docs/install-cli)
- [Descarga e importación de secretos Doppler](https://docs.doppler.com/docs/secrets)
- [age: cifrado, instalación y uso](https://github.com/FiloSottile/age#usage)
