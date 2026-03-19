#!/bin/bash
# Symphony Control Script

SERVICE_NAME="com.symphony.mrr-fyi"
PLIST="$HOME/Library/LaunchAgents/$SERVICE_NAME.plist"
LOG_DIR="$HOME/dev/levels/mrr-fyi/symphony/logs"

case "$1" in
    start)
        echo "Starting Symphony..."
        launchctl load "$PLIST"
        echo "✅ Symphony started"
        echo "📋 Logs: tail -f $LOG_DIR/stdout.log"
        ;;
    
    stop)
        echo "Stopping Symphony..."
        launchctl unload "$PLIST"
        echo "✅ Symphony stopped"
        ;;
    
    restart)
        echo "Restarting Symphony..."
        launchctl unload "$PLIST" 2>/dev/null
        launchctl load "$PLIST"
        echo "✅ Symphony restarted"
        ;;
    
    status)
        if launchctl list | grep -q "$SERVICE_NAME"; then
            echo "✅ Symphony is running"
            echo ""
            echo "Recent logs:"
            tail -20 "$LOG_DIR/stdout.log"
        else
            echo "❌ Symphony is not running"
        fi
        ;;
    
    logs)
        echo "📋 Following Symphony logs (Ctrl-C to exit)..."
        tail -f "$LOG_DIR/stdout.log"
        ;;
    
    errors)
        echo "❌ Error logs:"
        tail -50 "$LOG_DIR/stderr.log"
        ;;
    
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|errors}"
        echo ""
        echo "Commands:"
        echo "  start    - Start Symphony as background service"
        echo "  stop     - Stop Symphony"
        echo "  restart  - Restart Symphony"
        echo "  status   - Check if Symphony is running"
        echo "  logs     - Follow live logs"
        echo "  errors   - Show error logs"
        exit 1
        ;;
esac
