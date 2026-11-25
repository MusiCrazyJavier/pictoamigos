/* ============================================================================
   SECCIÓN: EMPACADO-TAURI — punto de entrada (escritorio + móvil).
   La app es 100% web (ver index.html): Tauri solo la empaqueta en un
   ejecutable que usa el WebView del sistema, así que NO lleva un navegador
   pesado dentro (5-15 MB en vez de ~180 MB de Electron).
   ========================================================================== */

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // No se usan APIs nativas de Tauri: toda la lógica está en js/
        .run(tauri::generate_context!())
        .expect("error al iniciar PictoAmigos");
}
