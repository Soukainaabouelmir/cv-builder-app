import React from 'react';

 const EducationSection = ({ education, handleEducationChange, handleAddEducation, handleRemoveEducation }) => (
  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
    <div className="flex items-center gap-3 mb-4">
      <GraduationCap className="text-green-600" size={24} />
      <h2 className="text-xl font-semibold text-gray-800">Formation</h2>
    </div>
    
    {education.map((edu, index) => (
      <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <input
            placeholder="Diplôme"
            value={edu.degree}
            onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            placeholder="École/Université"
            value={edu.school}
            onChange={(e) => handleEducationChange(index, 'school', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            placeholder="Année"
            value={edu.year}
            onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={() => handleRemoveEducation(index)}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
        >
          Supprimer
        </button>
      </div>
    ))}
    
    <button
      type="button"
      onClick={handleAddEducation}
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center gap-2"
    >
      <Plus size={16} />
      Ajouter Formation
    </button>
  </div>
);

export default EducationSection;