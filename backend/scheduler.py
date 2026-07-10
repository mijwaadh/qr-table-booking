import time
import logging
import threading
from datetime import datetime, timedelta

from market_sync import sync_market_prices

logger = logging.getLogger("market_scheduler")

class DailyScheduler:
    def __init__(self):
        self._thread = None
        self._stop_event = threading.Event()
        self.last_run_time = None
        self.next_run_time = None
        self.runs_count = 0

    def start(self):
        """Starts the background daily scheduler thread."""
        if self._thread is not None and self._thread.is_alive():
            logger.info("Daily scheduler is already running.")
            return
            
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._scheduler_loop, daemon=True)
        self._thread.start()
        logger.info("Daily market price background scheduler thread started successfully.")

    def stop(self):
        """Stops the scheduler thread."""
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2)
        logger.info("Daily scheduler thread stopped.")

    def trigger_sync(self) -> dict:
        """Manually triggers the sync service immediately."""
        logger.info("Manual synchronization triggered.")
        result = sync_market_prices()
        self.last_run_time = datetime.now()
        self.runs_count += 1
        return result

    def _scheduler_loop(self):
        # Run sync immediately on startup to ensure fresh data
        logger.info("[Scheduler] Executing startup sync job...")
        try:
            sync_market_prices()
            self.last_run_time = datetime.now()
            self.runs_count += 1
        except Exception as e:
            logger.error(f"[Scheduler] Startup sync failed: {e}")

        while not self._stop_event.is_set():
            # Calculate wait time until next day 4:00 AM (standard sync window)
            now = datetime.now()
            next_run = now.replace(hour=4, minute=0, second=0, microsecond=0)
            if next_run <= now:
                next_run += timedelta(days=1)
                
            self.next_run_time = next_run
            wait_seconds = (next_run - now).total_seconds()
            
            logger.info(f"[Scheduler] Next daily sync scheduled for: {next_run} (in {wait_seconds:.0f} seconds)")
            
            # Wait in chunks of 5 seconds to respond quickly to stop events
            slept = 0
            while slept < wait_seconds and not self._stop_event.is_set():
                time.sleep(5)
                slept += 5
                
            if self._stop_event.is_set():
                break

            # Execute scheduled sync
            logger.info("[Scheduler] Executing scheduled daily sync job...")
            try:
                sync_market_prices()
                self.last_run_time = datetime.now()
                self.runs_count += 1
            except Exception as e:
                logger.error(f"[Scheduler] Scheduled sync failed: {e}")

# Global scheduler instance
scheduler = DailyScheduler()
