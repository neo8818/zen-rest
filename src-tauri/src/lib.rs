//! Rest App - Tauri 后端
//! 处理窗口控制、全局快捷键、系统托盘等

use std::sync::Mutex;
use tauri::{
    AppHandle, Emitter, Manager, WebviewWindow,
    menu::{Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder},
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

// 存储当前注册的快捷键
struct ShortcutState_ {
    skip: Option<Shortcut>,
    pause: Option<Shortcut>,
}

static SHORTCUTS: Mutex<ShortcutState_> = Mutex::new(ShortcutState_ {
    skip: None,
    pause: None,
});

/// 进入休息模式 - 全屏显示
#[tauri::command]
fn enter_rest_mode(window: WebviewWindow) {
    // 先显示窗口（如果被隐藏/最小化）
    let _ = window.show();
    let _ = window.unminimize();
    // 设置全屏和置顶
    let _ = window.set_fullscreen(true);
    let _ = window.set_always_on_top(true);
    let _ = window.set_focus();
}

/// 退出休息模式 - 恢复窗口
#[tauri::command]
fn exit_rest_mode(window: WebviewWindow) {
    let _ = window.set_fullscreen(false);
    let _ = window.set_always_on_top(false);
    let _ = window.set_size(tauri::LogicalSize::new(500.0, 680.0));
    let _ = window.center();
}

/// 最小化到托盘
#[tauri::command]
fn minimize_to_tray(window: WebviewWindow) {
    let _ = window.hide();
}

/// 退出应用
#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

/// 解析快捷键字符串为 Shortcut
fn parse_shortcut(shortcut_str: &str) -> Option<Shortcut> {
    let parts: Vec<&str> = shortcut_str.split('+').collect();
    if parts.is_empty() {
        return None;
    }

    let mut modifiers = Modifiers::empty();
    let mut key_code: Option<Code> = None;

    for part in parts {
        match part.to_uppercase().as_str() {
            "CTRL" => modifiers |= Modifiers::CONTROL,
            "SHIFT" => modifiers |= Modifiers::SHIFT,
            "ALT" => modifiers |= Modifiers::ALT,
            "WIN" | "META" | "SUPER" => modifiers |= Modifiers::SUPER,
            k if k.len() == 1 => {
                key_code = match k.chars().next().unwrap() {
                    'A' => Some(Code::KeyA),
                    'B' => Some(Code::KeyB),
                    'C' => Some(Code::KeyC),
                    'D' => Some(Code::KeyD),
                    'E' => Some(Code::KeyE),
                    'F' => Some(Code::KeyF),
                    'G' => Some(Code::KeyG),
                    'H' => Some(Code::KeyH),
                    'I' => Some(Code::KeyI),
                    'J' => Some(Code::KeyJ),
                    'K' => Some(Code::KeyK),
                    'L' => Some(Code::KeyL),
                    'M' => Some(Code::KeyM),
                    'N' => Some(Code::KeyN),
                    'O' => Some(Code::KeyO),
                    'P' => Some(Code::KeyP),
                    'Q' => Some(Code::KeyQ),
                    'R' => Some(Code::KeyR),
                    'S' => Some(Code::KeyS),
                    'T' => Some(Code::KeyT),
                    'U' => Some(Code::KeyU),
                    'V' => Some(Code::KeyV),
                    'W' => Some(Code::KeyW),
                    'X' => Some(Code::KeyX),
                    'Y' => Some(Code::KeyY),
                    'Z' => Some(Code::KeyZ),
                    _ => None,
                };
            }
            _ => {}
        }
    }

    key_code.map(|code| {
        if modifiers.is_empty() {
            Shortcut::new(None, code)
        } else {
            Shortcut::new(Some(modifiers), code)
        }
    })
}

/// 更新快捷键
#[tauri::command]
fn update_shortcuts(app: AppHandle, skip_shortcut: String, pause_shortcut: String) -> Result<(), String> {
    let global_shortcut = app.global_shortcut();
    
    // 先注销旧的快捷键
    {
        let state = SHORTCUTS.lock().unwrap();
        if let Some(ref shortcut) = state.skip {
            let _ = global_shortcut.unregister(shortcut.clone());
        }
        if let Some(ref shortcut) = state.pause {
            let _ = global_shortcut.unregister(shortcut.clone());
        }
    }

    // 解析新快捷键
    let new_skip = parse_shortcut(&skip_shortcut);
    let new_pause = parse_shortcut(&pause_shortcut);

    // 注册跳过快捷键
    if let Some(shortcut) = new_skip.clone() {
        let app_handle = app.clone();
        if let Err(e) = global_shortcut.on_shortcut(shortcut.clone(), move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.emit("force-skip", ());
                }
            }
        }) {
            eprintln!("注册跳过快捷键失败: {}", e);
        }
        let _ = global_shortcut.register(shortcut);
    }

    // 注册暂停快捷键
    if let Some(shortcut) = new_pause.clone() {
        let app_handle = app.clone();
        if let Err(e) = global_shortcut.on_shortcut(shortcut.clone(), move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.emit("toggle-pause", ());
                }
            }
        }) {
            eprintln!("注册暂停快捷键失败: {}", e);
        }
        let _ = global_shortcut.register(shortcut);
    }

    // 更新状态
    {
        let mut state = SHORTCUTS.lock().unwrap();
        state.skip = new_skip;
        state.pause = new_pause;
    }

    println!("[Shortcuts] 已更新: skip={}, pause={}", skip_shortcut, pause_shortcut);
    Ok(())
}

/// 设置系统托盘
fn setup_tray(app: &AppHandle) -> Result<TrayIcon, Box<dyn std::error::Error>> {
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let show = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("Rest App - 休息提醒")
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "quit" => app.exit(0),
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click { .. } = event {
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(tray)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            enter_rest_mode,
            exit_rest_mode,
            minimize_to_tray,
            quit_app,
            update_shortcuts,
        ])
        .setup(|app| {
            // 设置托盘
            if let Err(e) = setup_tray(app.handle()) {
                eprintln!("托盘设置失败: {}", e);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
