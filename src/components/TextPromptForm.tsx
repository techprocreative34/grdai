// src/components/TextPromptForm.tsx
import formData from '@/data/textPrompts.json';

type FormField = {
  label: string;
  type: 'textarea' | 'select';
  placeholder?: string;
  options?: string[];
  description: string;
};
type FormData = { [key: string]: FormField; };
interface TextPromptFormProps { formState: { [key: string]: string }; onFormChange: (field: string, value: string) => void; }

export default function TextPromptForm({ formState, onFormChange }: TextPromptFormProps) {
  const typedFormData = formData as unknown as FormData;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Generator Prompt Teks</h2>
      {Object.entries(typedFormData).map(([key, field]) => (
        <div key={key}>
          <label htmlFor={key} className="block text-sm font-medium text-white mb-1">{field.label}</label>
          <p className="text-xs text-gray-400 mb-2">{field.description}</p>

          {field.type === 'select' ? (
            <select id={key} name={key} value={formState[key] || ''} onChange={(e) => onFormChange(key, e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition">
              <option value="">Pilih {field.label}...</option>
              {field.options?.map((option) => (<option key={option} value={option}>{option}</option>))}
            </select>
          ) : (
            <textarea id={key} name={key} value={formState[key] || ''} onChange={(e) => onFormChange(key, e.target.value)} placeholder={field.placeholder} rows={3} className="w-full bg-gray-800 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition" />
          )}
        </div>
      ))}
    </div>
  );
}