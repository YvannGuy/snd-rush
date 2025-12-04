'use client';

import { useState, useEffect } from 'react';
import { CalendarDisabledRange } from '@/types/db';

interface DateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onDatesChange: (start: string | null, end: string | null) => void;
  disabledRanges?: CalendarDisabledRange[];
  minDate?: string; // Format: YYYY-MM-DD
  language?: 'fr' | 'en';
}

export default function DateRangePicker({
  startDate,
  endDate,
  onDatesChange,
  disabledRanges = [],
  minDate,
  language = 'fr',
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const texts = {
    fr: {
      startDate: 'Date de début',
      endDate: 'Date de fin',
      selectDates: 'Sélectionnez vos dates',
      invalidRange: 'Plage de dates invalide',
      alreadyBooked: 'Déjà réservé',
    },
    en: {
      startDate: 'Start date',
      endDate: 'End date',
      selectDates: 'Select your dates',
      invalidRange: 'Invalid date range',
      alreadyBooked: 'Already booked',
    },
  };

  const currentTexts = texts[language];

  const isDateDisabled = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];

    // Vérifier si la date est dans le passé (avant minDate ou aujourd'hui)
    if (minDate) {
      if (dateStr < minDate) return true;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) return true;
    }

    // Vérifier si la date est dans une plage désactivée
    return disabledRanges.some((range) => {
      return dateStr >= range.start && dateStr < range.end;
    });
  };

  const isDateInRange = (date: Date): boolean => {
    if (!startDate || !endDate) return false;
    const dateStr = date.toISOString().split('T')[0];
    return dateStr >= startDate && dateStr < endDate;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    const dateStr = date.toISOString().split('T')[0];

    if (!startDate || (startDate && endDate)) {
      // Nouvelle sélection : définir la date de début
      onDatesChange(dateStr, null);
    } else if (startDate && !endDate) {
      // Sélectionner la date de fin
      if (dateStr <= startDate) {
        // Si la date sélectionnée est avant le début, inverser
        onDatesChange(dateStr, startDate);
      } else {
        // Vérifier qu'il n'y a pas de dates bloquées entre startDate et dateStr
        let hasBlockedDate = false;
        const start = new Date(startDate);
        const end = new Date(dateStr);

        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          if (isDateDisabled(d)) {
            hasBlockedDate = true;
            break;
          }
        }

        if (!hasBlockedDate) {
          onDatesChange(startDate, dateStr);
        }
      }
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = getDaysInMonth(year, month - 1);
    const firstDay = getFirstDayOfMonth(year, month - 1);
    const days = [];

    // Jours du mois précédent (pour remplir la première semaine)
    const prevMonthDays = getDaysInMonth(year, month - 2);
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 2, prevMonthDays - i);
      days.push(
        <button
          key={`prev-${i}`}
          type="button"
          className="text-gray-400 cursor-not-allowed"
          disabled
        >
          {prevMonthDays - i}
        </button>
      );
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const disabled = isDateDisabled(date);
      const inRange = isDateInRange(date);
      const isStart = dateStr === startDate;
      const isEnd = dateStr === endDate;

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(date)}
          disabled={disabled}
          className={`
            aspect-square flex items-center justify-center rounded-md transition-all text-xs
            ${disabled
              ? 'text-gray-300 cursor-not-allowed bg-gray-50'
              : isStart || isEnd
              ? 'bg-[#F2431E] text-white font-semibold'
              : inRange
              ? 'bg-[#F2431E]/10 text-[#F2431E]'
              : 'hover:bg-gray-100 text-gray-700'
            }
            ${isStart || isEnd ? 'ring-1 ring-[#F2431E]' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    // Jours du mois suivant (pour remplir la dernière semaine)
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <button
          key={`next-${day}`}
          type="button"
          className="text-gray-400 cursor-not-allowed"
          disabled
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = language === 'fr'
    ? ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayNames = language === 'fr'
    ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const [year, month] = currentMonth.split('-').map(Number);

  const goToPreviousMonth = () => {
    const newDate = new Date(year, month - 2, 1);
    setCurrentMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const goToNextMonth = () => {
    const newDate = new Date(year, month, 1);
    setCurrentMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="w-full">
      {/* Inputs de dates compacts */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            {currentTexts.startDate}
          </label>
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => {
              const newStart = e.target.value || null;
              if (!newStart || !endDate || newStart < endDate) {
                onDatesChange(newStart, endDate);
              }
            }}
            min={minDate || new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none focus:ring-1 focus:ring-[#F2431E]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            {currentTexts.endDate}
          </label>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => {
              const newEnd = e.target.value || null;
              if (!newEnd || !startDate || newEnd > startDate) {
                onDatesChange(startDate, newEnd);
              }
            }}
            min={startDate || minDate || new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-[#F2431E] focus:outline-none focus:ring-1 focus:ring-[#F2431E]"
          />
        </div>
      </div>

      {/* Calendrier compact */}
      <div className="border border-gray-200 rounded-xl p-4 bg-white">
        {/* En-tête du calendrier */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-sm font-bold text-gray-900">
            {monthNames[month - 1]} {year}
          </h3>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendar()}
        </div>

        {/* Légende compacte */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-[#F2431E] rounded"></div>
            <span className="text-gray-600">Sélectionné</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-gray-600">{currentTexts.alreadyBooked}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

