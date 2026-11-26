/* ============================================================================
   SECCIÓN: EMPACADO-TAURI — punto de entrada (escritorio + móvil).
   La app es 100% web (ver index.html): Tauri solo la empaqueta en un
   ejecutable que usa el WebView del sistema, así que NO lleva un navegador
   pesado dentro (5-15 MB en vez de ~180 MB de Electron).

   PERMISOS: sin este manejador, WebKitGTK deniega el micrófono y la
   práctica de pronunciación falla con NotAllowedError. Aquí se concede
   SOLO el micrófono (se usa únicamente en el propio dispositivo para
   practicar la pronunciación); el resto queda a criterio del sistema.
   ========================================================================== */

use tauri::webview::{PermissionKind, PermissionResponse};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // RENDERIZADO SEGURO (solo escritorio Linux/Wayland): el renderizador
    // DMABUF de WebKitGTK aborta el proceso web al repintar (p. ej. al pasar
    // el ratón por una tarjeta) y la ventana entera se cierra sin aviso.
    // Se desactiva DMABUF y se usa el renderizado por software/cairo, que es
    // estable. NO afecta a la versión web/PWA (esto solo corre en el binario
    // empaquetado; el navegador nunca ejecuta este código).
    // Documentado: https://webkitgtk.org/blog/2024/... (crashes en Wayland)
    #[cfg(all(target_os = "linux", not(target_os = "android")))]
    {
        if std::env::var_os("WAYLAND_DISPLAY").is_some()
            && std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none()
        {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
        // Respaldo manual: si con el anterior aún se cierra, lanzar con
        //   WEBKIT_DISABLE_COMPOSITING_MODE=1 ./PictoAmigos...
        // (No se fuerza por defecto: puede afectar al desplazamiento.)
    }

    tauri::Builder::default()
        // Concede el micrófono: necesario para "practicar la pronunciación".
        // (Sin este handler, wry/WebKitGTK deniega por defecto.)
        .on_permission_request(|_webview, kind| match kind {
            PermissionKind::Microphone => PermissionResponse::Allow,
            _ => PermissionResponse::Default,
        })
        // No se usan APIs nativas de Tauri: toda la lógica está en js/
        .run(tauri::generate_context!())
        .expect("error al iniciar PictoAmigos");
}

// build-stamp: 1795726677061
