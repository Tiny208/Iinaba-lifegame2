#!/usr/bin/env bash

# ==============================================================================
# nosleep.sh - Quản lý chế độ chống ngủ & tự động ngủ cho macOS
# Project: LifeGame2 (Hỗ trợ đa Agent & đa cửa sổ Antigravity)
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_FILE="/tmp/caffeinate_LifeGame2.pid"
WATCHER_PID_FILE="/tmp/nosleep_watcher_LifeGame2.pid"
CONFIG_FILE="${PROJECT_DIR}/.agents/sleep_config.json"
COUNTDOWN_DEFAULT=25

get_config_value() {
  local key="$1"
  local default_val="$2"
  if [ -f "$CONFIG_FILE" ]; then
    local val
    val=$(node -e "
      const fs = require('fs');
      try {
        const cfg = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
        console.log(cfg['$key'] !== undefined ? cfg['$key'] : '$default_val');
      } catch(e) {
        console.log('$default_val');
      }
    ")
    echo "$val"
  else
    echo "$default_val"
  fi
}

set_config_value() {
  local key="$1"
  local val="$2"
  node -e "
    const fs = require('fs');
    const path = '$CONFIG_FILE';
    let cfg = {};
    try { if (fs.existsSync(path)) cfg = JSON.parse(fs.readFileSync(path, 'utf8')); } catch(e){}
    cfg['$key'] = $val;
    fs.writeFileSync(path, JSON.stringify(cfg, null, 2));
  "
}

notify() {
  local title="$1"
  local msg="$2"
  osascript -e "display notification \"${msg}\" with title \"${title}\"" 2>/dev/null || true
}

play_alert_sound() {
  if [ -f "/System/Library/Sounds/Glass.aiff" ]; then
    afplay "/System/Library/Sounds/Glass.aiff" 2>/dev/null &
  fi
}

is_caffeinate_running() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE" 2>/dev/null)
    if [ -n "$pid" ] && ps -p "$pid" -o comm= 2>/dev/null | grep -q "caffeinate"; then
      return 0
    fi
  fi
  return 1
}

start_caffeinate() {
  if is_caffeinate_running; then
    return 0
  fi

  nohup caffeinate -disu >/dev/null 2>&1 &
  local new_pid=$!
  echo "$new_pid" > "$PID_FILE"

  echo "☕ [Chống ngủ] Đã kích hoạt (PID: $new_pid). Giữ máy không ngủ khi có Agent hoặc task chạy."
  notify "LifeGame2" "☕ Chế độ chống ngủ đã BẬT."
}

stop_caffeinate() {
  if is_caffeinate_running; then
    local pid
    pid=$(cat "$PID_FILE")
    kill "$pid" 2>/dev/null || true
    rm -f "$PID_FILE"
    echo "💤 [Chống ngủ] Đã tắt giữ thức (PID: $pid)."
  else
    rm -f "$PID_FILE"
  fi

  # Dừng cả watcher nếu đang chạy
  if [ -f "$WATCHER_PID_FILE" ]; then
    local wpid
    wpid=$(cat "$WATCHER_PID_FILE" 2>/dev/null)
    if [ -n "$wpid" ]; then
      kill "$wpid" 2>/dev/null || true
    fi
    rm -f "$WATCHER_PID_FILE"
  fi
}

start_watcher_daemon() {
  if [ -f "$WATCHER_PID_FILE" ]; then
    local wpid
    wpid=$(cat "$WATCHER_PID_FILE" 2>/dev/null)
    if [ -n "$wpid" ] && ps -p "$wpid" >/dev/null 2>&1; then
      echo "👁️ [Watcher Daemon] Đã đang chạy (PID: $wpid)."
      return 0
    fi
  fi

  nohup node "${PROJECT_DIR}/scripts/nosleep_watcher.js" >/dev/null 2>&1 &
  local new_wpid=$!
  echo "$new_wpid" > "$WATCHER_PID_FILE"
  echo "👁️ [Watcher Daemon] Đã khởi động ngầm (PID: $new_wpid). Đang theo dõi tất cả các Agent."
}

put_mac_to_sleep() {
  echo "🌙 Đang đưa máy vào chế độ Ngủ (Sleep)..."
  osascript -e 'tell application "Finder" to sleep' 2>/dev/null || pmset sleepnow 2>/dev/null || true
}

finish_task() {
  stop_caffeinate

  local enabled
  enabled=$(get_config_value "enabled" "true")
  if [ "$enabled" != "true" ]; then
    echo "ℹ️ Auto-sleep đang tắt theo cấu hình trong sleep_config.json."
    return 0
  fi

  local countdown
  countdown=$(get_config_value "countdownSeconds" "$COUNTDOWN_DEFAULT")

  play_alert_sound

  echo "🔔 TẤT CẢ các Agent và task đã kết thúc! Hiển thị hộp thoại đếm ngược ${countdown}s trước khi ngủ..."
  
  local script="tell application \"System Events\"
    activate
    set res to display dialog \"✅ TẤT CẢ Agent trong LifeGame2 đã hoàn tất!\\n\\nMáy tính sẽ tự động ngủ (Sleep) sau ${countdown} giây nếu bạn không hủy.\" with title \"LifeGame2 - Quản Lý Giấc Ngủ\" buttons {\"Hủy bỏ\", \"Ngủ ngay\"} default button \"Ngủ ngay\" giving up after ${countdown} with icon note
    return res
  end tell"

  local result
  result=$(osascript -e "$script" 2>&1)

  if echo "$result" | grep -q "gave up:true" || echo "$result" | grep -q "button returned:Ngủ ngay"; then
    echo "✅ Xác nhận ngủ máy (hết thời gian chờ hoặc bấm Ngủ ngay)."
    put_mac_to_sleep
  else
    echo "🛑 Đã hủy chế độ ngủ theo lựa chọn của người dùng."
    notify "LifeGame2" "🛑 Đã hủy chế độ ngủ. Máy vẫn tiếp tục hoạt động bình thường."
  fi
}

run_command_wrapper() {
  if [ $# -eq 0 ]; then
    echo "Cách dùng: $0 run <lệnh cần chạy...>"
    echo "Ví dụ: $0 run npm run build"
    exit 1
  fi

  echo "🚀 Bắt đầu thực thi lệnh: $*"
  start_caffeinate
  start_watcher_daemon

  "$@"
  local exit_code=$?

  echo "🏁 Lệnh đã kết thúc với mã thoát: $exit_code"
  return $exit_code
}

watch_process() {
  local target="$1"
  if [ -z "$target" ]; then
    echo "Cách dùng: $0 watch <PID hoặc tên tiến trình>"
    exit 1
  fi

  echo "👀 Đang theo dõi tiến trình: $target..."
  start_caffeinate
  start_watcher_daemon

  while true; do
    if [[ "$target" =~ ^[0-9]+$ ]]; then
      if ! ps -p "$target" >/dev/null 2>&1; then
        break
      fi
    else
      if ! pgrep -f "$target" >/dev/null 2>&1; then
        break
      fi
    fi
    sleep 3
  done

  echo "🏁 Tiến trình $target đã kết thúc!"
  finish_task
}

show_status() {
  echo "=== TRẠNG THÁI HỆ THỐNG QUẢN LÝ GIẤC NGỦ (LifeGame2) ==="
  
  if is_caffeinate_running; then
    local pid
    pid=$(cat "$PID_FILE")
    echo "☕ Chống ngủ (caffeinate): 🟢 ĐANG BẬT (PID: $pid)"
  else
    echo "☕ Chống ngủ (caffeinate): ⚪ ĐANG TẮT"
  fi

  if [ -f "$WATCHER_PID_FILE" ] && ps -p "$(cat "$WATCHER_PID_FILE" 2>/dev/null)" >/dev/null 2>&1; then
    echo "👁️ Watcher Daemon: 🟢 ĐANG THEO DÕI ĐA AGENT (PID: $(cat "$WATCHER_PID_FILE"))"
  else
    echo "👁️ Watcher Daemon: ⚪ ĐANG TẮT"
  fi

  echo ""
  echo "🤖 Trạng thái các Agent hiện tại:"
  node "${PROJECT_DIR}/scripts/check_active_agents.js"

  echo ""
  echo "📄 Cấu hình (.agents/sleep_config.json):"
  if [ -f "$CONFIG_FILE" ]; then
    cat "$CONFIG_FILE"
    echo ""
  fi
}

enable_auto_sleep() {
  set_config_value "autoSleepOnAgentStop" "true"
  set_config_value "enabled" "true"
  start_watcher_daemon
  echo "✅ Đã BẬT tính năng tự động ngủ khi xong TẤT CẢ các task & agent."
}

disable_auto_sleep() {
  set_config_value "autoSleepOnAgentStop" "false"
  set_config_value "enabled" "false"
  stop_caffeinate
  echo "🛑 Đã TẮT tính năng tự động ngủ."
}

set_countdown() {
  local sec="$1"
  if [[ "$sec" =~ ^[0-9]+$ ]]; then
    set_config_value "countdownSeconds" "$sec"
    echo "⏱️ Đã đặt thời gian đếm ngược là ${sec} giây."
  else
    echo "Lỗi: Vui lòng nhập số giây hợp lệ (ví dụ: $0 countdown 30)"
  fi
}

case "$1" in
  start|on)
    start_caffeinate
    start_watcher_daemon
    ;;
  stop|off)
    stop_caffeinate
    ;;
  daemon)
    start_watcher_daemon
    ;;
  agents)
    node "${PROJECT_DIR}/scripts/check_active_agents.js"
    ;;
  finish)
    finish_task
    ;;
  sleepnow)
    stop_caffeinate
    put_mac_to_sleep
    ;;
  enable)
    enable_auto_sleep
    ;;
  disable)
    disable_auto_sleep
    ;;
  countdown)
    set_countdown "$2"
    ;;
  run)
    shift
    run_command_wrapper "$@"
    ;;
  watch)
    shift
    watch_process "$@"
    ;;
  status)
    show_status
    ;;
  *)
    echo "Sử dụng: $0 {start|stop|daemon|agents|finish|run <cmd>|watch <pid/name>|enable|disable|countdown <sec>|status|sleepnow}"
    exit 1
  ;;
esac
