import React from 'react';
import TagInput from './TagInput';

const AptitudesSection = ({ formData, setFormData }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Aptitudes</h2>
      <TagInput
        tags={formData.aptitudes}
        setTags={(aptitudes) => setFormData(prev => ({ ...prev, aptitudes }))}
        placeholder="Add an aptitude (e.g. Teamwork, Leadership)"
        label="Your personal aptitudes"
      />
    </div>
  );
};

export default AptitudesSection;