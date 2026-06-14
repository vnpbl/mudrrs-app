import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

// --- Types ---
interface Room {
  id: string;
  name: string;
  campus: string;
  capacityMax: number;
  capacity: string;
}

interface GroupMember {
  id: string;
  name: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

// --- Constants & Mock Data ---
const ROOMS: Room[] = [
  { id: 'RM1', name: 'Discussion Room A', campus: 'Makati', capacityMax: 4, capacity: '2-4' },
  { id: 'RM2', name: 'Discussion Room B', campus: 'Makati', capacityMax: 8, capacity: '5-8' },
  { id: 'RM3', name: 'Multimedia Lab', campus: 'Makati', capacityMax: 8, capacity: '5-8' },
  { id: 'RM4', name: 'Study Pod 1', campus: 'Intramuros', capacityMax: 4, capacity: '2-4' },
  { id: 'RM5', name: 'Study Pod 2', campus: 'Intramuros', capacityMax: 4, capacity: '2-4' },
  { id: 'RM6', name: 'Conference Room C', campus: 'Intramuros', capacityMax: 8, capacity: '5-8' }
];

const BASE_TIME_BLOCKS = [
  "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", 
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", 
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", 
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM",
  "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM"
];

const HARDCODED_STUDENTS: Record<string, string> = {
  "2020111111": "Naveen Pablo",
  "2020222222": "Chloie Broñola",
  "2020333333": "Jessica Seno",
  "2020555555": "Professor Reyes"
};

const FIRST_NAMES = ["Sofia", "Miguel", "Maria", "Jose", "Isabella", "Gabriel", "Chloe", "Juan"];
const LAST_NAMES = ["Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres"];

// --- Helper Functions ---
const timeToMinutes = (timeStr: string) => {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number) => {
  let hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const modifier = hours >= 12 ? 'PM' : 'AM';
  let displayHour = hours % 12;
  displayHour = displayHour === 0 ? 12 : displayHour;
  return `${displayHour.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${modifier}`;
};

const getEndTime = (startTime: string, blocks: number) => {
  return minutesToTime(timeToMinutes(startTime) + (blocks * 30));
};

const generateRealisticName = (idStr: string) => {
  const num = parseInt(idStr.substring(idStr.length - 4)) || 0;
  const first = FIRST_NAMES[num % FIRST_NAMES.length];
  const last = LAST_NAMES[(Math.floor(num / 10)) % LAST_NAMES.length];
  return `${first} ${last}`;
};

const getUnavailableIndexes = (dateStr: string, roomId: string) => {
  const dayOfWeek = new Date(dateStr).getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return []; 
  switch (roomId) {
    case 'RM1': return [2, 3, 12, 13];
    case 'RM2': return [0, 1, 20, 21];
    case 'RM3': return [5, 6, 7, 15, 16];
    case 'RM4': return [1, 2, 20, 21, 22, 23];
    case 'RM5': return [8, 9, 10, 17, 18, 19];
    case 'RM6': return [10, 11, 12, 22, 23, 24, 25];
    default: return [];
  }
};

export default function BookingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter States
  const [filterCampus, setFilterCampus] = useState<string>('All');
  const [filterCapacity, setFilterCapacity] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('2026-06-10');

  // Booking Flow States
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [durationBlocks, setDurationBlocks] = useState<number>(1);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null);
  const [activity, setActivity] = useState<string>('Group Study / Review');
  const [equipment, setEquipment] = useState<string[]>([]);
  
  // Group Member States
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [memberError, setMemberError] = useState<string>('');
  const [notifyCheck, setNotifyCheck] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const filteredRooms = useMemo(() => {
    return ROOMS.filter(room => 
      (filterCampus === 'All' || room.campus === filterCampus) && 
      (filterCapacity === 'All' || room.capacity === filterCapacity)
    );
  }, [filterCampus, filterCapacity]);

  const currentSlots = useMemo<TimeSlot[]>(() => {
    if (!selectedRoom) return [];
    const unavailable = getUnavailableIndexes(filterDate, selectedRoom.id);
    return BASE_TIME_BLOCKS.map((time, idx) => ({
      time,
      available: !unavailable.includes(idx)
    }));
  }, [selectedRoom, filterDate]);

  const canAccommodate = (startIndex: number) => {
    if (startIndex + durationBlocks > currentSlots.length) return false;
    for (let i = 0; i < durationBlocks; i++) {
      if (!currentSlots[startIndex + i].available) return false;
    }
    return true;
  };

  const isReviewEnabled = selectedSlotIndex !== null && groupMembers.length > 0;

  // --- Handlers ---
  const handleClearFilters = () => {
    setFilterCampus('All');
    setFilterCapacity('All');
    setFilterDate('2026-06-10');
    handleRoomSelect(null);
  };

  const handleRoomSelect = (room: Room | null) => {
    setSelectedRoom(room);
    setSelectedSlotIndex(null);
    setHoveredSlotIndex(null);
    setGroupMembers([]);
    setActivity('Group Study / Review');
    setEquipment([]);
    setMemberError('');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterDate(e.target.value);
    setSelectedSlotIndex(null);
    setHoveredSlotIndex(null);
  };

  const toggleEquipment = (item: string) => {
    setEquipment(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const inputVal = memberSearch.trim();
    if (!inputVal || !selectedRoom) return;

    if (groupMembers.length >= selectedRoom.capacityMax - 1) {
      setMemberError("Room capacity limit reached.");
      return;
    }
    if (inputVal.length !== 10 || isNaN(Number(inputVal))) {
      setMemberError("Please enter a valid 10-digit Mapúa Student ID.");
      return;
    }
    if (groupMembers.find(m => m.id === inputVal)) {
      setMemberError("Student is already in the group.");
      return;
    }
    
    const foundName = HARDCODED_STUDENTS[inputVal] || generateRealisticName(inputVal);
    setGroupMembers(prev => [...prev, { id: inputVal, name: foundName }]);
    setMemberSearch('');
    setMemberError('');
  };

  const handleRemoveMember = (index: number) => {
    setGroupMembers(prev => prev.filter((_, i) => i !== index));
  };

  const handleReviewClick = () => {
    if (selectedSlotIndex === null || !selectedRoom) {
      alert("Please select a time slot first.");
      return;
    }
    if (groupMembers.length === 0) {
      setMemberError("At least one group member is required.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmBooking = () => {
    let alertMsg = `Success! Room reserved for ${currentSlots[selectedSlotIndex!].time} to ${getEndTime(currentSlots[selectedSlotIndex!].time, durationBlocks)}.`;
    if (notifyCheck && groupMembers.length > 0) {
      alertMsg += `\nAutomated booking emails have been dispatched to your ${groupMembers.length} group member(s).`;
    }
    alert(alertMsg);
    setIsModalOpen(false);
    handleRoomSelect(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-gray-900 font-sans antialiased">
      
      {/* Navigation Bar - Perfectly matches Homepage */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#991b1b] rounded-md"></div>
            <span className="font-bold text-xl tracking-tight text-gray-900">MUDRRS</span>
          </div>

          <div className="hidden md:flex gap-8">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 font-semibold text-sm py-5 border-b-2 border-transparent transition-colors">Home</Link>
            <Link to="/book" className="text-[#991b1b] font-bold text-sm py-5 border-b-2 border-[#991b1b] transition-colors">Book a Room</Link>
            <Link to="/reservations" className="text-gray-500 hover:text-gray-900 font-semibold text-sm py-5 border-b-2 border-transparent transition-colors">My Reservations</Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 p-1 pr-4 bg-gray-50 rounded-full border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-[#ffc000] text-gray-900 flex justify-center items-center font-bold text-xs">JB</div>
              <span className="text-sm font-semibold text-gray-700">Juan Dela Cruz</span>
            </div>
            <button 
              className="md:hidden text-gray-600 hover:text-gray-900 p-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden flex flex-col bg-white border-t border-gray-200 px-6 py-2 shadow-lg absolute w-full left-0">
            <Link to="/" className="text-gray-600 font-semibold py-4 border-b border-gray-100">Home</Link>
            <Link to="/book" className="text-[#991b1b] font-bold py-4 border-b border-gray-100">Book a Room</Link>
            <Link to="/reservations" className="text-gray-600 font-semibold py-4 border-b border-gray-100">My Reservations</Link>
          </div>
        )}
      </nav>

      {/* Main Content - max-w-7xl alignment */}
      <main className="w-full max-w-7xl mx-auto px-6 py-8 flex-grow">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Reserve a Space</h1>
          <p className="text-gray-500 font-medium">Find and secure a collaborative study room across Mapúa campuses.</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200/80 rounded-xl flex flex-col md:flex-row mb-8 shadow-sm">
          <div className="flex-1 flex flex-col p-4 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-gray-200/80">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Campus Location</label>
            <select value={filterCampus} onChange={(e) => setFilterCampus(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer">
              <option value="All">All Campuses</option>
              <option value="Makati">Makati</option>
              <option value="Intramuros">Intramuros</option>
            </select>
          </div>
          <div className="flex-1 flex flex-col p-4 md:px-6 md:py-4 border-b md:border-b-0 md:border-r border-gray-200/80">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Room Capacity</label>
            <select value={filterCapacity} onChange={(e) => setFilterCapacity(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer">
              <option value="All">Any Size</option>
              <option value="2-4">2 - 4 Students</option>
              <option value="5-8">5 - 8 Students</option>
            </select>
          </div>
          <div className="flex-1 flex flex-col p-4 md:px-6 md:py-4 md:border-r border-gray-200/80">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Date</label>
            <input type="date" value={filterDate} onChange={handleDateChange} className="w-full bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer" />
          </div>
          <button onClick={handleClearFilters} className="flex items-center justify-center gap-2 p-4 md:px-8 bg-gray-50 hover:bg-gray-100 text-[#991b1b] text-sm font-bold transition-colors rounded-b-xl md:rounded-r-xl md:rounded-bl-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            Clear Filters
          </button>
        </div>

        {/* Dashboard Grid - lg:grid-cols-3 exact match */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left: Rooms List (lg:col-span-2) */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Available Rooms</h2>
              <span className="text-xs font-bold bg-gray-200 px-3 py-1.5 rounded-full text-gray-700">{filteredRooms.length} Total</span>
            </div>
            
            <div className="flex flex-col gap-3.5">
              {filteredRooms.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-medium bg-white border border-dashed border-gray-300 rounded-xl">No rooms match your filters.</div>
              ) : (
                filteredRooms.map(room => {
                  const isActive = selectedRoom?.id === room.id;
                  return (
                    <div 
                      key={room.id}
                      onClick={() => handleRoomSelect(room)}
                      className={`bg-white border rounded-xl p-5 flex justify-between items-center cursor-pointer transition-all ${
                        isActive ? 'border-[#991b1b] ring-1 ring-[#991b1b] bg-red-50/10 shadow-sm' : 'border-gray-200/80 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-1.5">{room.name}</h3>
                        <div className="flex gap-5 text-xs font-medium text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            {room.campus}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            Cap: {room.capacity}
                          </div>
                        </div>
                      </div>
                      <svg className={`w-5 h-5 transition-transform ${isActive ? 'text-[#991b1b] translate-x-1' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Booking Panel (Sticky) */}
          <aside className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm sticky top-24">
            {!selectedRoom ? (
              <>
                <h2 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">Select a Room</h2>
                <p className="text-sm font-medium text-gray-500 leading-relaxed py-2">Choose a room from the list to configure your session.</p>
              </>
            ) : (
              <div className="flex flex-col h-full max-h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar">
                {/* Room Meta */}
                <div className="border-b border-gray-100 pb-5 mb-5">
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-2">{selectedRoom.name}</h2>
                  <div className="flex flex-col gap-2 text-xs font-semibold text-gray-500">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {selectedRoom.campus} Campus
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                      {selectedRoom.capacity} Students Max
                    </div>
                  </div>
                </div>

                {/* Duration */}
                <div className="mb-5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Session Duration</label>
                  <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                    {[
                      { label: '30 Min', blocks: 1 },
                      { label: '1 Hour', blocks: 2 },
                      { label: '1.5 Hrs', blocks: 3 },
                      { label: '2 Hrs', blocks: 4 }
                    ].map(dur => (
                      <button
                        key={dur.blocks}
                        onClick={() => { setDurationBlocks(dur.blocks); setSelectedSlotIndex(null); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          durationBlocks === dur.blocks ? 'bg-white text-[#991b1b] shadow-sm' : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="mb-5 pb-5 border-b border-gray-100">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Start Time</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {currentSlots.map((slot, idx) => {
                      const accommodates = canAccommodate(idx);
                      const isHoverPreview = hoveredSlotIndex !== null && accommodates && idx >= hoveredSlotIndex && idx < hoveredSlotIndex + durationBlocks;
                      const isSelectedMain = selectedSlotIndex === idx;
                      const isSelectedConsumed = selectedSlotIndex !== null && idx > selectedSlotIndex && idx < selectedSlotIndex + durationBlocks;
                      const isSelectedPreview = isSelectedMain || isSelectedConsumed;

                      return (
                        <button
                          key={idx}
                          disabled={!accommodates && selectedSlotIndex === null}
                          onMouseEnter={() => { if (selectedSlotIndex === null && accommodates) setHoveredSlotIndex(idx); }}
                          onMouseLeave={() => setHoveredSlotIndex(null)}
                          onClick={() => { if (accommodates) setSelectedSlotIndex(idx); }}
                          className={`
                            py-2 rounded-lg text-xs font-bold transition-all border text-center
                            ${(!accommodates && !isSelectedPreview) ? 'bg-gray-50 border-gray-100 text-gray-400 line-through cursor-not-allowed' : ''}
                            ${(accommodates && !isSelectedPreview && !isHoverPreview) ? 'bg-white border-gray-200/80 text-gray-700 hover:border-[#991b1b] hover:text-[#991b1b]' : ''}
                            ${isHoverPreview ? 'bg-red-50 border-red-200 text-[#991b1b]' : ''}
                            ${isSelectedMain ? 'bg-[#991b1b] border-[#991b1b] text-white shadow-sm' : ''}
                            ${isSelectedConsumed ? 'bg-red-50 border-red-200 text-[#991b1b]' : ''}
                          `}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Activity & Equipment */}
                <div className="mb-5 pb-5 border-b border-gray-100">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Activity & Equipment</label>
                  <select 
                    value={activity} 
                    onChange={(e) => setActivity(e.target.value)}
                    className="w-full border border-gray-200/80 rounded-lg py-2.5 px-3 text-sm font-medium text-gray-900 outline-none focus:border-[#991b1b] focus:ring-2 focus:ring-red-50 mb-4 bg-white transition-colors cursor-pointer"
                  >
                    <option>Group Study / Review</option>
                    <option>Project Meeting</option>
                    <option>Thesis / Capstone Defense</option>
                    <option>Online Class / Webinar</option>
                    <option>Other Academic Activity</option>
                  </select>

                  <div className="grid grid-cols-2 gap-y-2.5">
                    {['Whiteboard Marker', 'Whiteboard Eraser', 'Projector Remote', 'HDMI Cable', 'Extension Cord'].map(item => (
                      <label key={item} className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={equipment.includes(item)} onChange={() => toggleEquipment(item)} className="accent-[#991b1b] w-3.5 h-3.5 cursor-pointer" />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Group Members */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Group Members <span className="text-[#991b1b]">*</span></label>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{groupMembers.length} / {selectedRoom.capacityMax - 1} Added</span>
                  </div>
                  
                  <form onSubmit={handleAddMember} className="flex gap-2">
                    <input 
                      type="text" 
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Enter Student ID" 
                      className="flex-1 border border-gray-200/80 rounded-lg py-2.5 px-3 text-sm font-medium outline-none focus:border-[#991b1b] focus:ring-2 focus:ring-red-50 bg-white transition-colors"
                    />
                    <button type="submit" className="bg-gray-100 hover:bg-gray-200 border border-gray-200/80 text-gray-600 rounded-lg w-10 flex justify-center items-center transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                  </form>
                  {memberError && <p className="text-xs font-bold text-red-600 mt-1.5">{memberError}</p>}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {groupMembers.map((member, idx) => (
                      <div key={idx} className="bg-gray-100 border border-gray-200/80 rounded-full py-1 pl-3 pr-1.5 flex items-center gap-2 text-xs font-bold text-gray-700">
                        {member.name}
                        <button onClick={() => handleRemoveMember(idx)} className="text-gray-400 hover:text-[#991b1b] transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-start gap-2 mt-4 cursor-pointer group">
                    <input type="checkbox" checked={notifyCheck} onChange={() => setNotifyCheck(!notifyCheck)} className="mt-0.5 accent-[#991b1b] w-3.5 h-3.5 cursor-pointer" />
                    <span className="text-xs font-medium text-gray-500 leading-snug group-hover:text-gray-700 transition-colors">Send automated booking alerts and reminders to all group members via email.</span>
                  </label>
                </div>

                {/* Review Button */}
                <button 
                  onClick={handleReviewClick}
                  disabled={!isReviewEnabled}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-auto ${
                    isReviewEnabled 
                      ? 'bg-[#991b1b] text-white hover:bg-[#7f1d1d] shadow-sm hover:shadow-md active:scale-[0.98]' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200/80'
                  }`}
                >
                  {selectedSlotIndex === null ? "Select a time slot first" : 
                   groupMembers.length === 0 ? "Add at least one group member" : 
                   `Review • ${currentSlots[selectedSlotIndex].time} to ${getEndTime(currentSlots[selectedSlotIndex].time, durationBlocks)}`}
                </button>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* --- Confirmation Modal --- */}
      {isModalOpen && selectedRoom && selectedSlotIndex !== null && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Confirm Reservation</h2>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Space</span>
                  <strong className="text-gray-900 font-bold">{selectedRoom.name}</strong>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Date</span>
                  <strong className="text-gray-900 font-bold">{filterDate}</strong>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Time Window</span>
                  <strong className="text-[#991b1b] font-bold">{currentSlots[selectedSlotIndex].time} - {getEndTime(currentSlots[selectedSlotIndex].time, durationBlocks)}</strong>
                </div>
                <div className="flex justify-between items-start text-sm border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Activity</span>
                  <strong className="text-gray-900 font-bold text-right max-w-[60%]">{activity}</strong>
                </div>
                <div className="flex justify-between items-start text-sm border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Equipment</span>
                  <strong className="text-gray-900 font-bold text-right max-w-[60%]">{equipment.length > 0 ? equipment.join(', ') : 'None'}</strong>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-200/60 pt-3">
                  <span className="text-gray-500 font-medium">Group Size</span>
                  <strong className="text-gray-900 font-bold">{groupMembers.length + 1} Students</strong>
                </div>
                {notifyCheck && (
                  <div className="flex justify-between items-center text-sm border-t border-gray-200/60 pt-3">
                    <span className="text-gray-500 font-medium">Notifications</span>
                    <strong className="text-emerald-700 font-bold">Enabled</strong>
                  </div>
                )}
              </div>

              <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-[#991b1b] flex justify-center items-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Strict 15-Minute Grace Period</h4>
                  <p className="text-xs font-medium text-gray-600 leading-relaxed">Your group must surrender your Mapúa IDs at the library desk within 15 minutes of the start time, or this pending reservation will be automatically cancelled.</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
              <button onClick={handleConfirmBooking} className="px-6 py-2.5 text-sm font-bold bg-[#991b1b] text-white rounded-lg shadow-sm hover:bg-[#7f1d1d] hover:shadow-md transition-all active:scale-[0.98]">Confirm Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}