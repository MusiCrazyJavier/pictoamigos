// SECCIÓN: EMPACADO-TAURI — binario de escritorio.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    pictoamigos_lib::run();
}
