import React, { useState } from 'react';
import { Icon } from './Icon';

interface AddMemberFormProps {
  onAddMember: (name: string, instrument: string) => Promise<void>;
  addMultipleMembers: (members: { name: string, instrument: string }[]) => Promise<void>;
  onDone: () => void;
}

export const AddMemberForm: React.FC<AddMemberFormProps> = ({ onAddMember, addMultipleMembers, onDone }) => {
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bulkMembers, setBulkMembers] = useState<{ name: string, instrument: string }[]>([]);
  const [bulkError, setBulkError] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        onDone();
    } catch (err) {
        console.error("Failed to add member:", err);
        setError('An error occurred while adding the member. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setBulkError('');
    setBulkMembers([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        if (rows.length < 2) {
          throw new Error("CSV must have a header and at least one data row.");
        }

        const header = rows[0].split(',').map(h => h.trim().toLowerCase());
        const nameIndex = header.indexOf('name');
        const instrumentIndex = header.indexOf('instrument');

        if (nameIndex === -1 || instrumentIndex === -1) {
          throw new Error("CSV header must contain 'name' and 'instrument' columns.");
        }

        const parsedMembers = rows.slice(1).map(row => {
          const columns = row.split(',');
          const name = columns[nameIndex]?.trim();
          const instrument = columns[instrumentIndex]?.trim();
          if (!name || !instrument) return null;
          return { name, instrument };
        }).filter(Boolean) as { name: string, instrument: string }[];
        
        if (parsedMembers.length === 0) {
            throw new Error("No valid members found in the CSV file.");
        }

        setBulkMembers(parsedMembers);
      } catch (err: any) {
        setBulkError(err.message || 'Failed to parse CSV file.');
        setFileName('');
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
        setBulkError('Error reading file.');
        setIsParsing(false);
        setFileName('');
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (bulkMembers.length === 0) return;
    setIsBulkSubmitting(true);
    setBulkError('');
    try {
        await addMultipleMembers(bulkMembers);
        setBulkMembers([]);
        setFileName('');
        if(fileInputRef.current) fileInputRef.current.value = "";
        onDone(); 
    } catch (err) {
        console.error("Failed to bulk add members:", err);
        setBulkError('An error occurred while adding members. Please try again.');
    } finally {
        setIsBulkSubmitting(false);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col items-center">
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
                      type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500 transition"
                      placeholder="e.g., Priya Sharma" disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="instrument" className="block text-sm font-medium text-stone-300 mb-1">Instrument Name</label>
                  <input
                      type="text" id="instrument" value={instrument} onChange={(e) => setInstrument(e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded-lg p-3 focus:ring-orange-500 focus:border-orange-500 transition"
                      placeholder="e.g., Dhol, Tasha" disabled={isSubmitting}
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors duration-200 shadow-lg disabled:bg-stone-700 disabled:cursor-not-allowed flex items-center justify-center"
                  disabled={!name || !instrument || isSubmitting}
                >
                  {isSubmitting ? <><Icon type="spinner" className="w-5 h-5 mr-2" />Adding...</> : 'Add Member'}
                </button>
            </form>
            
            <div className="my-8 flex items-center text-center">
              <hr className="flex-grow border-t border-stone-700"/>
              <span className="px-4 text-stone-500 text-sm">OR</span>
              <hr className="flex-grow border-t border-stone-700"/>
            </div>

            <div className="text-center">
                <Icon type="download" className="w-16 h-16 text-orange-500 mx-auto" />
                <h3 className="text-xl font-bold text-stone-100 mt-4">Bulk Upload Members</h3>
                <p className="text-stone-400 mt-1 mb-6">Upload a CSV file with 'name' and 'instrument' columns.</p>
                
                <input
                    type="file" id="csv-upload" accept=".csv" onChange={handleFileChange} ref={fileInputRef}
                    className="hidden" disabled={isParsing || isBulkSubmitting}
                />
                <label htmlFor="csv-upload" className={`w-full inline-block cursor-pointer bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ${isParsing || isBulkSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isParsing ? 'Parsing...' : (fileName || 'Choose CSV File')}
                </label>
                
                {bulkError && <p className="text-red-400 text-sm mt-4">{bulkError}</p>}

                {bulkMembers.length > 0 && !bulkError && (
                    <div className="mt-4 text-left">
                        <p className="text-green-400 text-sm mb-4">{`Successfully parsed ${bulkMembers.length} members. Click below to add them.`}</p>
                        <button
                            onClick={handleBulkSubmit}
                            className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors duration-200 shadow-lg disabled:bg-stone-700 disabled:cursor-not-allowed flex items-center justify-center"
                            disabled={isBulkSubmitting}
                        >
                            {isBulkSubmitting ? (
                                <><Icon type="spinner" className="w-5 h-5 mr-2" />Adding Members...</>
                            ) : `Add ${bulkMembers.length} Members`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};