import React, { useState } from 'react';
import { Icon } from './Icon';

interface AddMemberFormProps {
  onAddMember: (name: string, instrument: string) => Promise<void>;
  onDone: () => void;
}

export const AddMemberForm: React.FC<AddMemberFormProps> = ({ onAddMember, onDone }) => {
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !instrument.trim()) {
      setError('Both name and instrument are required.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
        await onAddMember(name, instrument);
        setName('');
        setInstrument('');
        onDone(); // Navigate away after adding
    } catch (err) {
        console.error("Failed to add member:", err);
        setError('An error occurred while adding the member. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <Icon type="addMemberIllustration" className="w-24 h-24 text-orange-500 mx-auto" />
                <h2 className="text-2xl font-bold text-stone-100 mt-4">Add a New Member</h2>
                <p className="text-stone-400 mt-1">Fill out the details below to add a new team member.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                <label htmlFor="name" className="block text-sm font-medium text-stone-300 mb-1">Member Name</label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500 transition"
                    placeholder="e.g., Priya Sharma"
                    disabled={isSubmitting}
                />
                </div>
                <div>
                <label htmlFor="instrument" className="block text-sm font-medium text-stone-300 mb-1">Instrument Name</label>
                <input
                    type="text"
                    id="instrument"
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500 transition"
                    placeholder="e.g., Dhol, Tasha"
                    disabled={isSubmitting}
                />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                type="submit"
                className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors duration-200 shadow-lg disabled:bg-stone-700 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={!name || !instrument || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Icon type="spinner" className="w-5 h-5 mr-2" />
                      Adding...
                    </>
                  ) : 'Add Member'}
                </button>
            </form>
        </div>
    </div>
  );
};