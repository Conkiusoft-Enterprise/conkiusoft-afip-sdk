
<p align="center">

  <h3 align="center">Conkiusoft Afip sdk</h3>

  <p align="center">
    Conkiusoft Afip sdk
      Librería para conectarse a los Web Services de AFIP.
      Los manuales del WS se puede encontrar aca : https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp
      Esta libreria es un fork de la libreria AfipSDK pero con modificaciones para arreglar algunos bugs e integrar FACTURA DE EXPORTACIÓN.

  </p>
</p>

<!-- TABLE OF CONTENTS -->
## Tabla de contenidos

* [Guia de inicio](#guia-de-inicio)
  * [Instalacion](#instalacion)
  * [Como usarlo](#como-usarlo)
* [Licencia](#licencia)
* [Contacto](#contacto)


<!-- START GUIDE -->
## Guia de inicio

### Instalacion
#### Via npm

```
npm install -save conkiusoft-afipsdk 
```

# Como Implementarlo

1) Una vez instalada la librería en nuestro proyecto primero se debe reemplazar node_modules/conkiusoft-afipsdk/src/Afip_res/cert por tu certificado provisto por AFIP y node_modules/conkiusoft-afipsdk/src/Afip_res/key por la clave generada. 

2) En nuestro proyecto, donde necesitemos utilizar la libreria se debe importar:

````js
import Afip = require("conkiusoft-afipsdk");
````
Luego instanciar el objeto Afip, para eso se le pasan un objeto como parametro con algunas propiedades:
Propiedades del objeto:

CUIT [Obligatorio]: el numero de cuit.
S3_BUCKET [Opcional]: Bucket de S3 donde va a estar localizado la carpeta que almacena los tokens
S3_FOLDER [Opcional]: Carpeta que almacena los tokens
S3_REGION [Opcional]: Carpeta que almacena los tokens
S3_CREDENTIAL_ID [LOCAL ES REQUERIDO- DEPLOYADO NO SE NECESITA].
S3_CREDENTIAL_KEY [LOCAL ES REQUERIDO- DEPLOYADO NO SE NECESITA].

````js
const afip = new Afip({ CUIT: process.env.AFIP_CUIT});
````


<!-- LICENCE -->
### Licencia
Distribuido bajo la licencia MIT. Vea `LICENSE` para más información.


<!-- CONTACT -->
### Contacto
Conkiusoft Afip SDK - soporte@conkiusoft.com

Link del proyecto: [https://github.com/Conkiusoft-Enterprise/conkiusoft-afip-sdk](https://github.com/Conkiusoft-Enterprise/conkiusoft-afip-sdk)


_Este software y sus desarrolladores no tienen ninguna relación con la AFIP._
