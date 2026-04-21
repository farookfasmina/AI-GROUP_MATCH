import { useState } from 'react';
import { Save, Plus, Trash2, Clock } from 'lucide-react';

export default function AvailabilityForm({ initialData = [], onSubmit }) {
  // Ensure we don't crash if initialData is null from a failed API call
  const [slots, setSlots] = useState(initialData || []);

  const handleAddSlot = () => {
    setSlots([...slots, { day_of_week: 'Monday', start_time: '09:00', end_time: '17:00' }]);
  };

  const handleRemoveSlot = (index) => {
    const newSlots = [...slots];
    newSlots.splice(index, 1);
    setSlots(newSlots);
  };

  const handleChange = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(slots);
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Study Schedule
          </h2>
          <p className="text-sm text-slate-500 mt-1">Add your available times to find students with matching schedules.</p>
        </div>
        <button
          type="button"
          onClick={handleAddSlot}
          className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors outline-none"
        >
          <Plus className="w-4 h-4" />
          Add Slot
        </button>
      </div>

      <div className="space-y-4">
        {slots.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm font-medium">No availability slots added yet.</p>
            <p className="text-slate-400 text-xs mt-1">Click Add Slot to specify your free time.</p>
          </div>
        ) : (
          slots.map((slot, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <select
                value={slot.day_of_week}
                onChange={(e) => handleChange(idx, 'day_of_week', e.target.value)}
                className="w-full sm:w-1/3 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 text-sm font-medium outline-none bg-white"
              >
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => handleChange(idx, 'start_time', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 text-sm font-medium outline-none"
                />
                <span className="text-slate-400 font-medium">to</span>
                <input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => handleChange(idx, 'end_time', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 text-sm font-medium outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveSlot(idx)}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors outline-none"
                title="Remove Slot"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all duration-200 shadow-sm hover:shadow focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 outline-none"
        >
          <Save className="h-4 w-4" />
          Save Schedule
        </button>
      </div>
    </form>
  );
}
