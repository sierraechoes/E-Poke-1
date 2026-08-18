// AFTIS desktop shell (Tauri v2). Hosts the verified TypeScript engine inside a
// native WebView2 window and exposes IPC commands for native operations the
// browser sandbox cannot perform (e.g. shell-open, native notifications).
//
// The pricing, OMS, risk, simulator, and quant engines live in `engine/` and
// run inside the WebView; this crate provides the desktop container + bundling.

#[tauri::command]
fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn system_status() -> serde_json::Value {
    serde_json::json!({
        "product": "Twig D. Capra - AFTIS Terminal",
        "engine": "TypeScript reference (verified to the Section 4.1 accuracy matrix)",
        "native": cfg!(target_os = "windows"),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![app_version, system_status])
        .run(tauri::generate_context!())
        .expect("error while running AFTIS desktop");
}
