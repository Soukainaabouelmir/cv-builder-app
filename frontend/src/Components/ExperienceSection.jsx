import React from 'react';

  
const ExperienceSection = ({ experience, handleExperienceChange, handleAddExperience, handleRemoveExperience }) => (
  <div className="bg-white p-6 rounded-lg shadow-md mb-6">
    <div className="flex items-center gap-3 mb-4">
      <Briefcase className="text-purple-600" size={24} />
      <h2 className="text-xl font-semibold text-gray-800">Expérience Professionnelle</h2>
    </div>
    
    {experience.map((exp, index) => (
      <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <input
            placeholder="Poste"
            value={exp.position}
            onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            placeholder="Entreprise"
            value={exp.company}
            onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            placeholder="Année de début"
            value={exp.start}
            onChange={(e) => handleExperienceChange(index, 'start', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            placeholder="Année de fin"
            value={exp.end}
            onChange={(e) => handleExperienceChange(index, 'end', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <textarea
          placeholder="Détails des responsabilités et réalisations"
          value={exp.details}
          onChange={(e) => handleExperienceChange(index, 'details', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
          rows="3"
        />
        <button
          type="button"
          onClick={() => handleRemoveExperience(index)}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
        >
          Supprimer
        </button>
      </div>
    ))}
    
    <button
      type="button"
      onClick={handleAddExperience}
      className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors flex items-center gap-2"
    >
      <Plus size={16} />
      Ajouter Expérience
    </button>
  </div>
);


export default ExperienceSection;