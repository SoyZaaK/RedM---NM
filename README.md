# 📜 Normativas Maker - RedM Roleplay (1885)

> 🌐 **Web de prueba / Demo en vivo:** [soyzaak.github.io/RedM---NM](https://soyzaak.github.io/RedM---NM/)

**Normativas Maker** es una herramienta web interactiva diseñada específicamente para servidores de **RedM Roleplay (Red Dead Redemption 2)**. Permite a los administradores, sheriffs, alcaldes y jueces crear, maquetar y exportar leyes, ordenanzas municipales, reglamentos locales y decretos de la época (**1885**) de manera sencilla y con un acabado estético premium de pergamino antiguo.

La aplicación cuenta con previsualización en tiempo real con zoom adaptable, un panel interactivo para dibujar firmas a mano y conexión directa con Discord a través de Webhooks para notificar y publicar los documentos de forma inmediata en los canales del servidor.

---

## ✨ Características Principales

*   **Plantillas Temáticas de la Época (1885):**
    *   **Decreto Oficial:** Diseñado para la Oficina del Sheriff, Marshall y Leyes Generales (borde doble clásico, colores rojizos y tipografía de máquina de escribir antigua).
    *   **Ordenanza Municipal:** Ideal para el Ayuntamiento, alcaldías y avisos gubernamentales (borde limpio y tipografía formal).
    *   **Reglamento Local:** Orientado a normativas de negocios, Saloons, establos y conducta pública.
*   **Editor de Contenido Dinámico:**
    *   Campos para Título, Subtítulo/Asunto, Entidad Emisora, N.º de Decreto/Expediente, Fecha e Jurisdicción.
    *   **Artículos y Leyes Dinámicos:** Añade o elimina artículos del decreto sobre la marcha con un solo clic.
    *   Sección de penalizaciones y cláusulas de cierre para multas o tiempo de prisión.
*   **✍️ Panel de Firmas Avanzado e Interactivo:**
    *   **Caligrafía Antigua:** Renderiza automáticamente firmas elegantes utilizando fuentes manuscritas clásicas.
    *   **Firma Digital a Mano (Canvas):** Abre un lienzo emergente para dibujar tu propia firma realista a mano alzada con el ratón o en pantallas táctiles (móviles/tabletas).
    *   Soporta hasta 3 firmantes simultáneos con sus nombres y cargos correspondientes.
*   **🛡️ Sellos Oficiales de Época:**
    *   Estrella de Sheriff (tinta negra).
    *   Sello del Estado (tinta azul).
    *   Sello de Lacre Tradicional (cera roja tridimensional) en la esquina inferior.
    *   Marcas de agua integradas en el fondo del pergamino según el sello seleccionado.
*   **🌐 Integración Completa con Discord (Webhooks):**
    *   Envía el documento formateado como un Embed profesional en color oro al canal de Discord configurado.
    *   Incluye un botón para probar la conexión del Webhook en tiempo real.
    *   Opción de ocultar/mostrar la URL del Webhook para evitar filtraciones visuales en streams o capturas de pantalla.
*   **📥 Opciones de Exportación:**
    *   **Guardar en PDF / Imprimir:** Generación en formato A4 listo para imprimir físicamente o guardar digitalmente.
    *   **Descargar como Imagen (PNG):** Exporta el documento en alta definición (escala x2 con `html2canvas`) con transparencia.
    *   **Copiar Markdown para Discord:** Copia el texto estructurado del decreto con formato de negritas, citas e iconos listo para pegar en chats comunes de Discord.
*   **💾 Persistencia y Seguridad Local:**
    *   Autoguardado continuo de borradores utilizando `localStorage`.
    *   Capa de protección contra errores de almacenamiento local para permitir que la web funcione perfectamente al abrirse directamente desde el navegador de archivos local (`file://`).

---

## 🛠️ Stack Tecnológico

La web está construida completamente en el lado del cliente (Front-End) sin necesidad de base de datos o servidores dedicados:

*   **Estructura:** HTML5 Semántico.
*   **Estilos:** CSS3 Vanilla con variables personalizadas (CSS Custom Properties), diseño flexible (Flexbox y Grid), y transiciones fluidas.
*   **Lógica:** JavaScript ES6+ Vanilla (Manipulación del DOM, API de Canvas para dibujo, Fetch API para Webhooks y gestión de estado local).
*   **Tipografía (Google Fonts):**
    *   *Rye* (Títulos estilo Western)
    *   *Special Elite* (Tipografía de máquina de escribir antigua)
    *   *Pinyon Script* (Caligrafía manuscrita de época)
    *   *Outfit* (Interfaz moderna del panel de control)
*   **Librerías Externas:**
    *   [html2canvas (v1.4.1)](https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js) para la rasterización y descarga del pergamino en formato PNG.

---

## 📁 Estructura del Proyecto

```text
Normativas Maker/
├── index.html          # Interfaz principal (Formulario del editor y visor del pergamino)
├── style.css           # Estilos de la aplicación y del pergamino (tematización 1885)
├── app.js              # Lógica interactiva (Canvas de firmas, Webhooks, Zoom y html2canvas)
└── assets/             # Recursos visuales
    ├── paper_texture.png # Textura de fondo del pergamino antiguo
    ├── sheriff_seal.png  # Sello de la Oficina de Sheriff
    ├── state_seal.png    # Sello oficial del Estado
    └── wax_seal.png      # Sello de lacre rojo en 3D
```

---

## 🚀 Instalación y Uso Local

Al no requerir compilación ni backend, puedes ejecutar la aplicación al instante:

1.  **Descarga** o clona esta carpeta en tu ordenador.
2.  Abre el archivo `index.html` en cualquier navegador moderno (Google Chrome, Microsoft Edge, Firefox, Safari).
3.  *¡Listo!* Ya puedes empezar a redactar tus leyes del viejo oeste.

> [!NOTE]
> Para utilizar la función **Descargar Imagen (PNG)** es necesario tener conexión a internet activa, ya que el archivo `html2canvas.min.js` se carga mediante un CDN externo.

---

## 🤝 Créditos y Licencia

*   **Desarrollo:** ZaaK
*   **Comunidad Destinada:** Territorios de RedM / SRM (Spanish RolePlay Multiplayer)
*   *Diseñado con propósitos de entretenimiento y roleplay histórico.*
