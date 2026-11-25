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
