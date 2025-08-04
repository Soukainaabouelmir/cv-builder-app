import { useState } from 'react';

import TagInput from './TagInput';

const LanguagesSection = ({ formData, setFormData }) => {
  const [proficiencyLevels, setProficiencyLevels] = useState(
    formData.languages.reduce((acc, lang) => {
      acc[lang] = formData.languageProficiency?.[lang] || 'intermediate';
      return acc;
    }, {})
  );

  const handleLanguageChange = (newLanguages) => {
    // Update proficiency levels when languages change
    const updatedProficiency = {};
    newLanguages.forEach(lang => {
      updatedProficiency[lang] = proficiencyLevels[lang] || 'intermediate';
    });
    
    setProficiencyLevels(updatedProficiency);
    setFormData(prev => ({
      ...prev,
      languages: newLanguages,
      languageProficiency: updatedProficiency
    }));
  };

  const handleProficiencyChange = (language, level) => {
    const updated = { ...proficiencyLevels, [language]: level };
    setProficiencyLevels(updated);
    setFormData(prev => ({
      ...prev,
      languageProficiency: updated
    }));
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Languages</h2>
      
      <TagInput
        tags={formData.languages}
        setTags={handleLanguageChange}
        placeholder="Add a language (e.g. English, French)"
        label="Languages you speak"
      />

      {formData.languages.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Proficiency Levels</h3>
          {formData.languages.map((language) => (
            <div key={language} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{language}</span>
              <div className="flex items-center space-x-2">
                {['basic', 'intermediate', 'fluent', 'native'].map((level) => (
                  <label key={level} className="inline-flex items-center">
                    <input
                      type="radio"
                      name={`proficiency-${language}`}
                      checked={proficiencyLevels[language] === level}
                      onChange={() => handleProficiencyChange(language, level)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {level}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguagesSection;