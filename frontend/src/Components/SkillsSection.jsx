import React from 'react';
import TagInput from './TagInput';

const SkillsSection = ({ formData, setFormData }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Skills</h2>
      <TagInput
        tags={formData.skills}
        setTags={(skills) => setFormData(prev => ({ ...prev, skills }))}
        placeholder="Add a skill"
        label="Your professional skills"
      />
    </div>
  );
};

export default SkillsSection;