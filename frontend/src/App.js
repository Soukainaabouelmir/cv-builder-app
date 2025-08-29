import React, { useState } from 'react';
import { User, Upload, GraduationCap, Briefcase, Award, Globe, Star, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

function App() {
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    photo: null,
    education: [{ degree: '', school: '', year: '' }],
    experience: [{ position: '', company: '', start: '', end: '', details: '' }],
    skills: [],
    languages: [],
    aptitudes: []
  });

  
  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [aptitudeInput, setAptitudeInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [debugInfo, setDebugInfo] = useState([]);
  const [serverStatus, setServerStatus] = useState('unknown');

 
  const addDebugInfo = (info) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
    
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'La photo doit faire moins de 5MB' });
        return;
      }
      
      addDebugInfo(`Photo sélectionnée: ${file.name} (${Math.round(file.size/1024)}KB)`);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, photo: e.target.result }));
        addDebugInfo('Photo encodée en base64 avec succès');
      };
      reader.readAsDataURL(file);
    }
  };


  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', school: '', year: '' }]
    }));
  };

  const handleRemoveEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const handleEducationChange = (index, field, value) => {
    const newEducation = [...formData.education];
    newEducation[index][field] = value;
    setFormData(prev => ({ ...prev, education: newEducation }));
  };

  
  const handleAddExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { position: '', company: '', start: '', end: '', details: '' }]
    }));
  };

  const handleRemoveExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const handleExperienceChange = (index, field, value) => {
    const newExperience = [...formData.experience];
    newExperience[index][field] = value;
    setFormData(prev => ({ ...prev, experience: newExperience }));
  };

  
  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  
  const handleAddLanguage = () => {
    if (languageInput.trim()) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, languageInput.trim()]
      }));
      setLanguageInput('');
    }
  };

  const handleRemoveLanguage = (index) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  
  const handleAddAptitude = () => {
    if (aptitudeInput.trim()) {
      setFormData(prev => ({
        ...prev,
        aptitudes: [...prev.aptitudes, aptitudeInput.trim()]
      }));
      setAptitudeInput('');
    }
  };

  const handleRemoveAptitude = (index) => {
    setFormData(prev => ({
      ...prev,
      aptitudes: prev.aptitudes.filter((_, i) => i !== index)
    }));
  };

  
  const testServerConnection = async () => {
    try {
      addDebugInfo('Test de connexion au serveur...');
      const response = await fetch('http://localhost:5000/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        addDebugInfo(`Serveur OK: ${data.message || 'Réponse reçue'}`);
        setServerStatus('connected');
        return true;
      } else {
        addDebugInfo(`Serveur répond avec erreur: ${response.status}`);
        setServerStatus('error');
        return false;
      }
    } catch (error) {
      addDebugInfo(`Erreur connexion serveur: ${error.message}`);
      setServerStatus('disconnected');
      return false;
    }
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setMessage({ type: '', text: '' });
    setDebugInfo([]);

    
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Le nom est obligatoire' });
      setIsGenerating(false);
      return;
    }

    addDebugInfo('Début de génération du CV');
    addDebugInfo(`Nom: ${formData.name}`);

    try {
      
      const serverAvailable = await testServerConnection();
      if (!serverAvailable) {
        setMessage({ 
          type: 'error', 
          text: 'Serveur non disponible. Assurez-vous que le serveur Flask est démarré sur le port 5000.' 
        });
        setIsGenerating(false);
        return;
      }

      
      const cleanedData = {
        ...formData,
        education: formData.education.filter(edu => 
          edu.degree.trim() || edu.school.trim() || edu.year.trim()
        ),
        experience: formData.experience.filter(exp => 
          exp.position.trim() || exp.company.trim() || exp.start.trim() || exp.end.trim()
        )
      };

      addDebugInfo(`Données nettoyées: ${cleanedData.education.length} formations, ${cleanedData.experience.length} expériences`);
      addDebugInfo(`Compétences: ${cleanedData.skills.length}, Langues: ${cleanedData.languages.length}, Aptitudes: ${cleanedData.aptitudes.length}`);

      
      const dataToLog = { ...cleanedData };
      if (dataToLog.photo) {
        dataToLog.photo = `[Photo base64: ${dataToLog.photo.substring(0, 50)}...]`;
      }
      
      addDebugInfo('Envoi de la requête au serveur...');

      const response = await fetch('http://localhost:5000/generate-cv', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/pdf'
        },
        body: JSON.stringify(cleanedData)
      });

      addDebugInfo(`Réponse serveur: ${response.status} ${response.statusText}`);

      if (response.ok) {
       
        const contentType = response.headers.get('content-type');
        addDebugInfo(`Type de contenu: ${contentType}`);

        const blob = await response.blob();
        addDebugInfo(`Taille du fichier: ${blob.size} bytes`);

        if (blob.size === 0) {
          throw new Error('Le fichier PDF généré est vide');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cv_${formData.name.replace(/\s+/g, '_')}.pdf`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        addDebugInfo('Téléchargement initié');
        
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          addDebugInfo('Nettoyage terminé');
        }, 100);

        setMessage({ type: 'success', text: 'CV généré et téléchargé avec succès !' });
      } else {
   
        const errorText = await response.text();
        addDebugInfo(`Erreur serveur: ${errorText}`);
        
        let errorMessage = 'Erreur lors de la génération du CV';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        setMessage({ type: 'error', text: errorMessage });
      }
    } catch (error) {
      addDebugInfo(`Erreur catch: ${error.name} - ${error.message}`);
      let errorMessage = 'Erreur de connexion au serveur';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le serveur Flask est démarré.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsGenerating(false);
      addDebugInfo('Fin du processus');
    }
  };

  const renderSkillsSection = (title, icon, color, items, input, setInput, addHandler, removeHandler) => {
    const colorClasses = {
      orange: {
        icon: 'text-orange-600',
        button: 'bg-orange-500 hover:bg-orange-600',
        badge: 'bg-orange-100 text-orange-800',
        remove: 'text-orange-600 hover:text-orange-800'
      },
      blue: {
        icon: 'text-blue-600',
        button: 'bg-blue-500 hover:bg-blue-600',
        badge: 'bg-blue-100 text-blue-800',
        remove: 'text-blue-600 hover:text-blue-800'
      },
      indigo: {
        icon: 'text-indigo-600',
        button: 'bg-indigo-500 hover:bg-indigo-600',
        badge: 'bg-indigo-100 text-indigo-800',
        remove: 'text-indigo-600 hover:text-indigo-800'
      }
    };

    const currentColor = colorClasses[color] || colorClasses.blue;

    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center gap-3 mb-4">
          {React.createElement(icon, { className: currentColor.icon, size: 24 })}
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>
        
        <div className="flex gap-2 mb-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ajouter ${title.toLowerCase()}`}
            className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && addHandler()}
          />
          <button
            type="button"
            onClick={addHandler}
            className={`${currentColor.button} text-white px-4 py-2 rounded transition-colors`}
          >
            Ajouter
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={index}
              className={`inline-flex items-center gap-1 ${currentColor.badge} px-3 py-1 rounded-full text-sm`}
            >
              {item}
              <button
                type="button"
                onClick={() => removeHandler(index)}
                className={`${currentColor.remove} ml-1`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  };

  const getServerStatusIcon = () => {
    switch (serverStatus) {
      case 'connected':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'error':
        return <XCircle className="text-red-500" size={16} />;
      case 'disconnected':
        return <XCircle className="text-red-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Générateur de CV</h1>
          <p className="text-gray-600">Créez votre CV professionnel en quelques minutes</p>
          
          {/* Statut du serveur */}
          {/* <div className="flex items-center justify-center gap-2 mt-4 text-sm">
            {getServerStatusIcon()}
            <span>Statut serveur: {serverStatus}</span>
            <button
              type="button"
              onClick={testServerConnection}
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              Tester
            </button>
          </div> */}
        </div>

        
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'error' 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            <AlertCircle size={20} />
            <span>{message.text}</span>
          </div>
        )}

        {/* Informations de debug */}
        {/* {debugInfo.length > 0 && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Informations de debug:</h3>
            <div className="text-sm font-mono max-h-40 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index} className="mb-1">{info}</div>
              ))}
            </div>
          </div>
        )} */}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 ">
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="text-blue-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Informations Personnelles</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-200 bg-gray-100 flex items-center justify-center">
                      {formData.photo ? (
                        <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User size={48} className="text-gray-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                      <Upload size={16} />
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                  </div>
                </div>
                
                <input
                  name="name"
                  placeholder="Nom complet *"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <input
                  name="email"
                  type="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <input
                  name="phone"
                  placeholder="Téléphone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <input
                  name="address"
                  placeholder="Adresse"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="text-green-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Formation</h2>
              </div>

              {formData.education.map((edu, index) => (
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
                  {formData.education.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(index)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddEducation}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                Ajouter Formation
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="text-purple-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Expérience Professionnelle</h2>
              </div>
              
              {formData.experience.map((exp, index) => (
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
                  {formData.experience.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(index)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddExperience}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors"
              >
                Ajouter Expérience
              </button>
            </div>
            
           
            {renderSkillsSection(
              "Compétences",
              Award,
              "orange",
              formData.skills,
              skillInput,
              setSkillInput,
              handleAddSkill,
              handleRemoveSkill
            )}
            
            {renderSkillsSection(
              "Langues",
              Globe,
              "blue",
              formData.languages,
              languageInput,
              setLanguageInput,
              handleAddLanguage,
              handleRemoveLanguage
            )}
            
            {renderSkillsSection(
              "Aptitudes",
              Star,
              "indigo",
              formData.aptitudes,
              aptitudeInput,
              setAptitudeInput,
              handleAddAptitude,
              handleRemoveAptitude
            )}

            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={isGenerating}
                className={`${
                  isGenerating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                } text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg`}
              >
                <Download size={20} className={isGenerating ? 'animate-spin' : ''} />
                {isGenerating ? 'Génération en cours...' : 'Générer mon CV'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;