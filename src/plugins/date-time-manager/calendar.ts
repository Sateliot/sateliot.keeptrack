import { ToastMsgType } from '@app/interfaces';
import { keepTrackApi } from '@app/keepTrackApi';
import { getEl } from '@app/lib/get-el';
import i18next from 'i18next';
import { WatchlistOverlay } from '../watchlist/watchlist-overlay';

export class Calendar {
  private containerId: string;
  private calendarDate: Date;
  private simulationDate: Date | null;
  private isVisible: boolean = false;
  private timerUntilEnabled: number | null = 10000;
  private isCalendarEnabled: boolean = false;

  constructor(containerId: string) {
    this.containerId = containerId;
    this.calendarDate = new Date();
    this.simulationDate = new Date(keepTrackApi.getTimeManager().simulationTimeObj);

    setTimeout(() => {
      this.isCalendarEnabled = true;
    }, this.timerUntilEnabled);
  }

  private render(date?: Date): void {
    this.calendarDate = date ?? this.calendarDate;
    const container = document.getElementById(this.containerId);

    if (!container) {
      console.error(`Container with ID ${this.containerId} not found`);

      return;
    }

    const datepickerDiv = document.getElementById('ui-datepicker-div');

    if (datepickerDiv) {
      datepickerDiv.remove();
    }

    const newDatepickerDiv = document.createElement('div');

    newDatepickerDiv.id = 'ui-datepicker-div';
    newDatepickerDiv.className = 'ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all';
    newDatepickerDiv.style.display = this.isVisible ? 'block' : 'none';
    newDatepickerDiv.style.position = 'absolute';
    newDatepickerDiv.style.zIndex = '1000';

    newDatepickerDiv.innerHTML = `
      <div class="ui-datepicker-header ui-widget-header ui-helper-clearfix ui-corner-all">
        <a class="ui-datepicker-prev ui-corner-all" data-handler="prev" data-event="click" title="Prev">
          <span class="ui-icon ui-icon-circle-triangle-w">Prev</span>
        </a>
        <a class="ui-datepicker-next ui-corner-all" data-handler="next" data-event="click" title="Next">
          <span class="ui-icon ui-icon-circle-triangle-e">Next</span>
        </a>
        <div class="ui-datepicker-title">
          <span class="ui-datepicker-month">${this.getUTCMonthName(this.calendarDate.getUTCMonth())}</span>&nbsp;
          <span class="ui-datepicker-year">${this.calendarDate.getUTCFullYear()}</span>
        </div>
      </div>
      <table class="ui-datepicker-calendar">
        <thead>
          <tr>${this.renderDayHeaders()}</tr>
        </thead>
        <tbody>
          ${this.renderCalendarDays()}
        </tbody>
      </table>
      ${this.renderTimePicker()}
      <div class="ui-datepicker-buttonpane ui-widget-content">
        <button type="button" class="ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all" data-handler="today" data-event="click">
          ${i18next.t('time.calendar.now')}
        </button>
        <button type="button" class="ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all" data-handler="hide" data-event="click">
          ${i18next.t('time.calendar.done')}
        </button>
      </div>
    `;

    document.body.appendChild(newDatepickerDiv);
  }

  private attachEvents(): void {
    document.querySelector(`#${this.containerId}`)?.addEventListener('click', this.toggleDatePicker.bind(this));

    const prevButton = document.querySelector('#ui-datepicker-div .ui-datepicker-prev');
    const nextButton = document.querySelector('#ui-datepicker-div .ui-datepicker-next');

    if (prevButton) {
      prevButton.addEventListener('click', this.goToPreviousMonth.bind(this));
    }

    if (nextButton) {
      nextButton.addEventListener('click', this.goToNextMonth.bind(this));
    }

    document.querySelectorAll('#ui-datepicker-div td[data-handler="selectDay"]').forEach((td) => {
      td.addEventListener('click', (event) => this.selectDay(event));
    });

    const nowButton = document.querySelector('#ui-datepicker-div .ui-datepicker-current');
    const doneButton = document.querySelector('#ui-datepicker-div .ui-datepicker-close');

    if (nowButton) {
      nowButton.addEventListener('click', this.setToNow.bind(this));
    }

    if (doneButton) {
      doneButton.addEventListener('click', this.hideDatePicker.bind(this));
    }

    // Attach events for time sliders
    this.attachSliderEvents('ui_tpicker_hour_slider', this.updateHour.bind(this));
    this.attachSliderEvents('ui_tpicker_minute_slider', this.updateMinute.bind(this));
    this.attachSliderEvents('ui_tpicker_second_slider', this.updateSecond.bind(this));

    // Attach events for time adjustment buttons
    this.attachTimeAdjustmentEvents('hour');
    this.attachTimeAdjustmentEvents('minute');
    this.attachTimeAdjustmentEvents('second');
  }

  private attachTimeAdjustmentEvents(unit: 'hour' | 'minute' | 'second'): void {
    const increaseButton = document.getElementById(`${unit}_increase`);
    const decreaseButton = document.getElementById(`${unit}_decrease`);

    if (increaseButton && decreaseButton) {
      increaseButton.addEventListener('click', () => this.adjustTime(unit, 1));
      decreaseButton.addEventListener('click', () => this.adjustTime(unit, -1));
    }
  }

  private adjustTime(unit: 'hour' | 'minute' | 'second', change: 1 | -1): void {
    let currentValue: number;

    if (unit === 'hour') {
      currentValue = this.simulationDate.getUTCHours();
      const updatedHour = (currentValue + change + 24) % 24;

      if (updatedHour === 0 && currentValue === 23) {
        // The date is now the next day
        this.simulationDate.setUTCDate(this.simulationDate.getUTCDate() + 1);
      } else if (updatedHour === 23 && currentValue === 0) {
        // The date is now the previous day
        this.simulationDate.setUTCDate(this.simulationDate.getUTCDate() - 1);
      }

      this.simulationDate.setUTCHours(updatedHour);
    }

    if (unit === 'minute') {
      currentValue = this.simulationDate.getUTCMinutes();
      const updatedMinute = (currentValue + change + 60) % 60;

      if (updatedMinute === 0 && currentValue !== 0) {
        // The hour is now the next hour
        this.simulationDate.setUTCHours(this.simulationDate.getUTCHours() + 1);
      } else if (updatedMinute === 59 && currentValue !== 59) {
        // The hour is now the previous hour
        this.simulationDate.setUTCHours(this.simulationDate.getUTCHours() - 1);
      }

      this.simulationDate.setUTCMinutes(updatedMinute);
    }

    if (unit === 'second') {
      currentValue = this.simulationDate.getUTCSeconds();
      const updatedSecond = (currentValue + change + 60) % 60;

      if (updatedSecond === 0 && currentValue !== 0) {
        // The minute is now the next minute
        this.simulationDate.setUTCMinutes(this.simulationDate.getUTCMinutes() + 1);
      } else if (updatedSecond === 59 && currentValue !== 59) {
        // The minute is now the previous minute
        this.simulationDate.setUTCMinutes(this.simulationDate.getUTCMinutes() - 1);
      }

      this.simulationDate.setUTCSeconds(updatedSecond);
    }

    this.datetimeInputFormChange();
    this.updateTimeInput();
    this.render();
    this.attachEvents();
  }

  private attachSliderEvents(sliderId: string, updateFunction: (value: number) => void): void {
    const slider = document.getElementById(sliderId);

    if (slider) {
      const min = parseInt(slider.getAttribute('data-min') || '0');
      const max = parseInt(slider.getAttribute('data-max') || '59');
      const step = parseInt(slider.getAttribute('data-step') || '1');
      const handle = slider.querySelector('.ui-slider-handle') as HTMLElement;

      const updateSliderPosition = (clientX: number) => {
        const rect = slider.getBoundingClientRect();
        let percentage = (clientX - rect.left) / rect.width;

        percentage = Math.max(0, Math.min(1, percentage));
        const value = Math.round((percentage * (max - min) + min) / step) * step;

        handle.style.left = `${percentage * 100}%`;
        updateFunction(value);
      };

      const onMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        updateSliderPosition(e.clientX);
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      slider.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        updateSliderPosition(e.clientX);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    }
  }

  private renderDayHeaders(): string {
    const daysOfWeek = [
      i18next.t('time.days-short.0'), i18next.t('time.days-short.1'), i18next.t('time.days-short.2'),
      i18next.t('time.days-short.3'), i18next.t('time.days-short.4'), i18next.t('time.days-short.5'), i18next.t('time.days-short.6'),
    ];


    return daysOfWeek.map((day, index) =>
      `<th scope="col" class="${index === 0 || index === 6 ? 'ui-datepicker-week-end' : ''}">
        <span title="${this.getUTCDayFullName(index)}">${day}</span>
      </th>`,
    ).join('');
  }

  private renderCalendarDays(): string {
    const firstDay = new Date(this.calendarDate.getUTCFullYear(), this.calendarDate.getUTCMonth(), 1).getUTCDay();
    const daysInMonth = new Date(this.calendarDate.getUTCFullYear(), this.calendarDate.getUTCMonth() + 1, 0).getUTCDate();
    const today = new Date();
    let dayHtml = '';
    let dayCount = 1;

    for (let i = 0; i < 6; i++) {
      let row = '<tr>';

      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDay) {
          row += '<td class="ui-datepicker-other-month ui-datepicker-unselectable ui-state-disabled">&nbsp;</td>';
        } else if (dayCount <= daysInMonth) {
          const isToday = this.calendarDate.getUTCFullYear() === today.getUTCFullYear() &&
            this.calendarDate.getUTCMonth() === today.getUTCMonth() &&
            dayCount === today.getUTCDate();
          const isSelected = this.simulationDate &&
            this.simulationDate.getUTCFullYear() === this.calendarDate.getUTCFullYear() &&
            this.simulationDate.getUTCMonth() === this.calendarDate.getUTCMonth() &&
            this.simulationDate.getUTCDate() === dayCount;
          const classes = [
            j === 0 || j === 6 ? 'ui-datepicker-week-end' : '',
            isToday ? 'ui-datepicker-today' : '',
            isSelected ? 'ui-datepicker-current-day' : '',
          ].filter(Boolean).join(' ');

          const jday = this.getUTCDayOfYear(new Date(this.calendarDate.getUTCFullYear(), this.calendarDate.getUTCMonth(), dayCount));

          const dayCountPadded = dayCount.toString().padStart(2, '0');
          const jdayPadded = jday.toString().padStart(3, '0');

          row += `
            <td class="${classes}" data-handler="selectDay" data-event="click" data-month="${this.calendarDate.getUTCMonth()}" data-year="${this.calendarDate.getUTCFullYear()}">
              <a class="ui-state-default${isToday ? ' ui-state-highlight' : ''}${isSelected ? ' ui-state-active' : ''}" href="#">
                <span class="ui-datepicker-cal-day">${dayCountPadded}</span>
                <span class="ui-datepicker-jday">${jdayPadded}</span>
              </a>
            </td>
          `;
          dayCount++;
        } else {
          row += '<td class="ui-datepicker-other-month ui-datepicker-unselectable ui-state-disabled">&nbsp;</td>';
        }
      }
      row += '</tr>';
      dayHtml += row;
    }

    return dayHtml;
  }

  private isLeapYear(date: Date): boolean {
    const year = date.getUTCFullYear();

    if ((year & 3) !== 0) {
      return false;
    }

    return year % 100 !== 0 || year % 400 === 0;
  }

  private getUTCDayOfYear(doy: Date) {
    const mn = doy.getUTCMonth();
    const dn = doy.getUTCDate();
    const dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let dayOfYear = dayCount[mn] + dn;

    if (mn > 1 && this.isLeapYear(doy)) {
      dayOfYear++;
    }

    return dayOfYear;
  }

  private getUTCDateFromDayOfYear(year: number, dayOfYear: number): Date {
    const isLeapYear = this.isLeapYear(this.createUTCDate(year, 0, 1));
    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let month = 0;

    while (dayOfYear > daysInMonth[month]) {
      dayOfYear -= daysInMonth[month];
      month++;
    }

    return this.createUTCDate(year, month, dayOfYear);
  }

  private createUTCDate(year: number, month?: number, day?: number, hours?: number, minutes?: number, seconds?: number): Date {
    const date = new Date(Date.UTC(year, month ?? 0, day ?? 1, hours ?? 0, minutes ?? 0, seconds ?? 0));

    return date;
  }

  private renderTimePicker(): string {
    const hours = this.simulationDate.getUTCHours();
    const minutes = this.simulationDate.getUTCMinutes();
    const seconds = this.simulationDate.getUTCSeconds();

    return `
      <div class="ui-timepicker-div">
        <dl>
          <dt class="ui_tpicker_time_label">${i18next.t('time.calendar.time')}</dt>
          <dd class="ui_tpicker_time">
            <input id="calendar-time-input" class="ui_tpicker_time_input" value="${this.formatTime(hours, minutes, seconds)}" disabled>
          </dd>
          <dt class="ui_tpicker_hour_label">${i18next.t('time.calendar.hour')}</dt>
          <dd class="ui_tpicker_hour">
            <div id="ui_tpicker_hour_slider" class="ui_tpicker_hour_slider ui-slider ui-corner-all ui-slider-horizontal ui-widget ui-widget-content" style="display: inline-block; width: 100px;" data-min="0" data-max="23" data-step="1">
              <span tabindex="0" class="ui-slider-handle ui-corner-all ui-state-default" style="left: ${(hours / 23) * 100}%;"></span>
            </div>
            <span class="ui-slider-access ui-controlgroup ui-controlgroup-horizontal ui-helper-clearfix ui-corner-left" role="toolbar" style="margin-left: 10px; margin-right: 0px;">
              <button data-icon="ui-icon-minus" data-step="-1" class="ui-widget ui-button-icon-only ui-controlgroup-item ui-button ui-corner-left" title="-" id="hour_decrease">
                <span class="ui-button-icon ui-icon ui-icon-minus"></span>
                <span class="ui-button-icon-space"> </span>-
              </button>
              <button data-icon="ui-icon-plus" data-step="1" class="ui-widget ui-button-icon-only ui-controlgroup-item ui-button ui-corner-right" title="+" id="hour_increase">
                <span class="ui-button-icon ui-icon ui-icon-plus"></span>
                <span class="ui-button-icon-space"> </span>+
              </button>
            </span>
          </dd>
          <dt class="ui_tpicker_minute_label">${i18next.t('time.calendar.minute')}</dt>
          <dd class="ui_tpicker_minute">
            <div id="ui_tpicker_minute_slider" class="ui_tpicker_minute_slider ui-slider ui-corner-all ui-slider-horizontal ui-widget ui-widget-content" style="display: inline-block; width: 100px;" data-min="0" data-max="59" data-step="1">
              <span tabindex="0" class="ui-slider-handle ui-corner-all ui-state-default" style="left: ${(minutes / 59) * 100}%;"></span>
            </div>
            <span class="ui-slider-access ui-controlgroup ui-controlgroup-horizontal ui-helper-clearfix ui-corner-left" role="toolbar" style="margin-left: 10px; margin-right: 0px;">
              <button data-icon="ui-icon-minus" data-step="-1" class="ui-widget ui-button-icon-only ui-controlgroup-item ui-button ui-corner-left" title="-" id="minute_decrease">
                <span class="ui-button-icon ui-icon ui-icon-minus"></span>
                <span class="ui-button-icon-space"> </span>-
              </button>
              <button data-icon="ui-icon-plus" data-step="1" class="ui-widget ui-button-icon-only ui-controlgroup-item ui-button ui-corner-right" title="+" id="minute_increase">
                <span class="ui-button-icon ui-icon ui-icon-plus"></span>
                <span class="ui-button-icon-space"> </span>+
              </button>
            </span>
          </dd>
          <dt class="ui_tpicker_second_label">${i18next.t('time.calendar.second')}</dt>
          <dd class="ui_tpicker_second">
            <div id="ui_tpicker_second_slider" class="ui_tpicker_second_slider ui-slider ui-corner-all ui-slider-horizontal ui-widget ui-widget-content" style="display: inline-block; width: 100px;" data-min="0" data-max="59" data-step="1">
              <span tabindex="0" class="ui-slider-handle ui-corner-all ui-state-default" style="left: ${(seconds / 59) * 100}%;"></span>
            </div>
            <span class="ui-slider-access ui-controlgroup ui-controlgroup-horizontal ui-helper-clearfix ui-corner-left" role="toolbar" style="margin-left: 10px; margin-right: 0px;">
              <button data-icon="ui-icon-minus" data-step="-1" class="ui-widget ui-button-icon-only ui-controlgroup-item ui-button ui-corner-left" title="-" id="second_decrease">
                <span class="ui-button-icon ui-icon ui-icon-minus"></span>
                <span class="ui-button-icon-space"> </span>-
              </button>
              <button data-icon="ui-icon-plus" data-step="1" class="ui-widget ui-button-icon-only ui-controlgroup-item ui-button ui-corner-right" title="+" id="second_increase">
                <span class="ui-button-icon ui-icon ui-icon-plus"></span>
                <span class="ui-button-icon-space"> </span>+
              </button>
            </span>
          </dd>
        </dl>
      </div>
    `;
  }

  private getUTCMonthName(monthIndex: number): string {
    const monthNames = [
      i18next.t('time.months.1'), i18next.t('time.months.2'), i18next.t('time.months.3'),
      i18next.t('time.months.4'), i18next.t('time.months.5'), i18next.t('time.months.6'),
      i18next.t('time.months.7'), i18next.t('time.months.8'), i18next.t('time.months.9'),
      i18next.t('time.months.10'), i18next.t('time.months.11'), i18next.t('time.months.12'),
    ];


    return monthNames[monthIndex];
  }

  private getUTCDayFullName(dayIndex: number): string {
    const dayNames = [
      i18next.t('time.days.0'), i18next.t('time.days.1'), i18next.t('time.days.2'),
      i18next.t('time.days.3'), i18next.t('time.days.4'), i18next.t('time.days.5'), i18next.t('time.days.6'),
    ];


    return dayNames[dayIndex];
  }

  private goToPreviousMonth(): void {
    this.calendarDate.setMonth(this.calendarDate.getUTCMonth() - 1);
    this.render();
    this.attachEvents();
  }

  private goToNextMonth(): void {
    this.calendarDate.setMonth(this.calendarDate.getUTCMonth() + 1);
    this.render();
    this.attachEvents();
  }

  private selectDay(event: Event): void {
    const target = event.target as HTMLElement;
    let dayOfYear = -1;

    if (target.classList.contains('ui-datepicker-cal-day')) {
      // If we pick the calendar day, find the parent, then get the second span (class === ui-datepicker-jday)
      dayOfYear = parseInt((target.parentElement?.querySelector('.ui-datepicker-jday') as HTMLElement)?.innerText ?? '-1');
    } else if (target.tagName === 'A') {
      dayOfYear = parseInt((target.querySelector('.ui-datepicker-jday') as HTMLElement)?.innerText ?? '-1');
    } else if (target.classList.contains('ui-datepicker-jday')) {
      dayOfYear = parseInt(target.innerText);
    }

    if (dayOfYear === -1) {
      return;
    }

    const selectedDate = this.getUTCDateFromDayOfYear(this.calendarDate.getUTCFullYear(), dayOfYear);

    selectedDate.setUTCHours(this.simulationDate.getUTCHours());
    selectedDate.setUTCMinutes(this.simulationDate.getUTCMinutes());
    selectedDate.setUTCSeconds(this.simulationDate.getUTCSeconds());

    this.simulationDate = new Date(selectedDate);

    this.datetimeInputFormChange();
    this.render();
    this.attachEvents();
  }

  private setToNow(): void {
    this.calendarDate = new Date();
    this.simulationDate = new Date(this.calendarDate);
    this.datetimeInputFormChange();
    this.render();
    this.attachEvents();
  }

  toggleDatePicker(): void {
    if (!this.isCalendarEnabled) {
      keepTrackApi.getUiManager().toast(i18next.t('errorMsgs.catalogNotFullyInitialized'), ToastMsgType.caution, true);

      return;
    }

    this.isVisible = !this.isVisible;
    const datepicker = document.getElementById('ui-datepicker-div');

    if (datepicker) {
      datepicker.style.display = this.isVisible ? 'block' : 'none';
    }
  }

  showDatePicker(): void {
    if (!this.isCalendarEnabled) {
      keepTrackApi.getUiManager().toast(i18next.t('errorMsgs.catalogNotFullyInitialized'), ToastMsgType.caution, true);

      return;
    }

    this.isVisible = true;
    const datepicker = document.getElementById('ui-datepicker-div');

    if (datepicker) {
      datepicker.style.display = 'block';
    }
  }

  hideDatePicker(): void {
    this.isVisible = false;
    const datepicker = document.getElementById('ui-datepicker-div');

    if (datepicker) {
      datepicker.style.display = 'none';
    }
  }

  private updateHour(hour: number): void {
    this.simulationDate.setUTCHours(hour);
    this.datetimeInputFormChange();
    this.updateTimeInput();
    this.updateSliderPosition('ui_tpicker_hour_slider', hour, 23);
  }

  private updateMinute(minute: number): void {
    this.simulationDate.setUTCMinutes(minute);
    this.datetimeInputFormChange();
    this.updateTimeInput();
    this.updateSliderPosition('ui_tpicker_minute_slider', minute, 59);
  }

  private updateSecond(second: number): void {
    this.simulationDate.setUTCSeconds(second);
    this.datetimeInputFormChange();
    this.updateTimeInput();
    this.updateSliderPosition('ui_tpicker_second_slider', second, 59);
  }

  private updateSliderPosition(sliderId: string, value: number, max: number): void {
    const slider = document.getElementById(sliderId);

    if (slider) {
      const handle = slider.querySelector('.ui-slider-handle') as HTMLElement;

      if (handle) {
        handle.style.left = `${(value / max) * 100}%`;
      }
    }
  }

  private updateTimeInput(): void {
    const timeInput = document.getElementById('calendar-time-input') as HTMLInputElement;

    if (timeInput) {
      timeInput.value = this.formatTime(
        this.simulationDate.getUTCHours(),
        this.simulationDate.getUTCMinutes(),
        this.simulationDate.getUTCSeconds(),
      );
    }
  }

  private formatTime(hours: number, minutes: number, seconds: number): string {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  public getSelectedDate(): Date | null {
    return this.simulationDate;
  }

  public setDate(date: Date): void {
    this.calendarDate = new Date(date);
    this.simulationDate = new Date(date);
    this.render();
    this.attachEvents();
  }

  datetimeInputFormChange() {
    const timeManagerInstance = keepTrackApi.getTimeManager();
    const colorSchemeManagerInstance = keepTrackApi.getColorSchemeManager();

    const today = new Date();
    const jday = this.getUTCDayOfYear(timeManagerInstance.simulationTimeObj);

    getEl('jday').innerHTML = jday.toString();
    timeManagerInstance.changeStaticOffset(this.simulationDate.getTime() - today.getTime());
    colorSchemeManagerInstance.setColorScheme(settingsManager.currentColorScheme, true);
    timeManagerInstance.calculateSimulationTime();

    timeManagerInstance.lastBoxUpdateTime = timeManagerInstance.realTime;

    try {
      const watchlistOverlay = keepTrackApi.getPlugin(WatchlistOverlay);

      watchlistOverlay.lastOverlayUpdateTime = timeManagerInstance.realTime * 1 - 7000;
      const uiManagerInstance = keepTrackApi.getUiManager();

      uiManagerInstance.updateNextPassOverlay(true);
    } catch {
      // Ignore
    }
  }
}