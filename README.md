
<p align="center">
  <a href="https://github.com/afipsdk/afip.js">
    <img src="https://conkiusoft.com/assets/images/Conkiusoft%20black%20stroke.png" alt="conkiusoft-afipsdk.js" width="130" height="130">
  </a>

  <h3 align="center">Conkiusoft Afip sdk</h3>

  <p align="center">
    Librería para conectarse a los Web Services de AFIP
    <br />
    <a href="https://github.com/afipsdk/afip.js/wiki"><strong>Explorar documentación »</strong></a>
    <br />
    <br />
    <a href="https://github.com/afipsdk/afip.js/issues">Reportar un bug</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
## Tabla de contenidos

* [Acerca del proyecto](#acerca-del-proyecto)
* [Guia de inicio](#guia-de-inicio)
  * [Instalacion](#instalacion)
  * [Como usarlo](#como-usarlo)
* [Web Services](#web-services)
  * [Factura electronica](#factura-electronica)
* [Integrar otro web service](https://afipsdk.com/pro/js/generic_web_service.html)
* [Ejemplos de uso](https://afipsdk.com/pro/js/examples/index.html)
* [Tutoriales para la página AFIP](https://afipsdk.com/pro/js/tutorials/index.html)
* [Solución a errores más frecuentes](https://afipsdk.com/pro/js/errors.html)
* [Preguntas frecuentes](https://afipsdk.com/pro/js/faq.html)
* [Proyectos relacionados](#proyectos-relacionados)
* [¿Necesitas ayuda? 🚀](#necesitas-ayuda-)
* [Licencia](#licencia)
* [Contacto](#contacto)



<!-- ABOUT THE PROJECT -->
## Acerca del proyecto
Afip SDK es la forma más rápida y simple de conectarse con los Web Services de AFIP.

Esta librería fue creada con la intención de ayudar a los programadores a usar los Web Services de AFIP sin romperse la cabeza ni perder tiempo tratando de entender la complicada documentación que AFIP provee.


<!-- START GUIDE -->
## Guia de inicio

### Instalacion
#### Via npm

```
npm install --save @afipsdk/afip.js
```

#### Via Yarn

```
yarn add @afipsdk/afip.js
```

**Siguiente paso** 
* Remplazar *node_modules/@afipsdk/afip.js/Afip_res/cert* por tu certificado provisto por AFIP y *node_modules/@afipsdk/afip.js/Afip_res/key* por la clave generada. 
* La carpeta *Afip_res* deberá tener permisos de escritura.

Ir a [Tutoriales para la página AFIP](https://afipsdk.com/pro/js/tutorials/index.html) para obtener mas información de como generar la clave y certificado

# Como usarlo

Lo primero es incluir el SDK en tu aplicación
````js
const Afip = require('@afipsdk/afip.js');
````

Luego creamos una instancia de la clase Afip pasandole un Objeto como parámetro.
````js
const afip = new Afip({ CUIT: 20111111112 });
````


Para más información acerca de los parámetros que se le puede pasar a la instancia new `Afip()` consulte sección [Primeros pasos](https://github.com/afipsdk/afip.js/wiki/Primeros-pasos#como-usarlo) de la documentación

Una vez realizado esto podemos comenzar a usar el SDK con los Web Services disponibles


<!-- WEB SERVICES -->
## Web Services

Si necesitas más información de cómo utilizar algún web service echa un vistazo a la [documentación completa de afip.js](https://github.com/afipsdk/afip.js/wiki)

### Factura electronica
Podes encontrar la documentación necesaria para utilizar la [facturación electrónica](https://github.com/afipsdk/afip.js/wiki/Facturaci%C3%B3n-Electr%C3%B3nica) 👈 aquí


<!-- RELATED PROJECTS-->
### Proyectos relacionados

#### Libreria para PHP
Si necesitas acceder los web services de AFIP en **PHP** podes utilizar [Afip.php](https://github.com/afipsdk/afip.php)

<!-- AFIP SDK PRO -->
### ¿Necesitas ayuda? 🚀

¿Quieres implementarlo de forma rápida y fiable? Obtén Afip SDK PRO que incluye una amplia documentación con ejemplos, tutoriales, implementación en Frameworks y plataformas, y mucho más.


**[¡Ahora es gratis!](https://afipsdk.com/pro/js/index.html)**


<!-- LICENCE -->
### Licencia
Distribuido bajo la licencia MIT. Vea `LICENSE` para más información.


<!-- CONTACT -->
### Contacto
Conkiusoft Afip SDK - soporte@conkiusoft.com

Link del proyecto: [https://github.com/afipsdk/afip.js](https://github.com/afipsdk/afip.js)


_Este software y sus desarrolladores no tienen ninguna relación con la AFIP._
