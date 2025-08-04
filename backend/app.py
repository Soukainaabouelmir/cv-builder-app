from flask import Flask, request, send_file, jsonify
from fpdf import FPDF
import os
from flask_cors import CORS
import base64
import io
from PIL import Image
import traceback

app = Flask(__name__)
# Configuration CORS spécifique
CORS(app, resources={
    r"/generate-cv": {"origins": ["http://localhost:3000"]},
    r"/health": {"origins": ["http://localhost:3000"]}
})

UPLOAD_FOLDER = 'generated_cvs'
IMAGES_FOLDER = 'temp_images'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(IMAGES_FOLDER, exist_ok=True)

class ModernPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)
        
    def header(self):
        # En-tête moderne avec couleur
        self.set_fill_color(41, 128, 185)  # Bleu moderne
        self.rect(0, 0, 210, 20, 'F')
        
    def add_colored_section(self, title, color_r=52, color_g=152, color_b=219):
        """Ajoute une section avec titre coloré"""
        self.ln(5)
        self.set_fill_color(color_r, color_g, color_b)
        self.set_text_color(255, 255, 255)
        self.set_font('Arial', 'B', 12)
        self.cell(0, 8, title.encode('latin-1', 'replace').decode('latin-1'), 0, 1, 'L', True)
        self.set_text_color(0, 0, 0)
        self.ln(2)
        
    def add_personal_info(self, name, email, phone, address, photo_path=None):
        """Ajoute les informations personnelles avec photo"""
        self.ln(10)
        
        # Si photo disponible, l'ajouter à droite
        if photo_path and os.path.exists(photo_path):
            # Nom en gros à gauche
            self.set_font('Arial', 'B', 20)
            self.set_text_color(52, 73, 94)
            self.cell(120, 15, name.encode('latin-1', 'replace').decode('latin-1'), 0, 0)
            
            # Photo à droite
            try:
                self.image(photo_path, 140, 25, 30, 30)
                print(f"Photo ajoutée avec succès: {photo_path}")
            except Exception as e:
                print(f"Erreur ajout photo: {e}")
                
            self.ln(20)
        else:
            # Nom centré si pas de photo
            self.set_font('Arial', 'B', 20)
            self.set_text_color(52, 73, 94)
            self.cell(0, 15, name.encode('latin-1', 'replace').decode('latin-1'), 0, 1, 'C')
            
        # Informations de contact
        self.set_font('Arial', '', 11)
        self.set_text_color(100, 100, 100)
        contact_info = f"{email} | {phone}"
        if address:
            contact_info += f" | {address}"
        self.cell(0, 8, contact_info.encode('latin-1', 'replace').decode('latin-1'), 0, 1, 'C')
        self.ln(5)
        
    def add_section_content(self, content, is_list=False):
        """Ajoute le contenu d'une section"""
        self.set_font('Arial', '', 10)
        self.set_text_color(60, 60, 60)
        
        if is_list and isinstance(content, list):
            # Pour les listes (compétences, langues, etc.)
            items_per_line = 3
            for i, item in enumerate(content):
                if i > 0 and i % items_per_line == 0:
                    self.ln(6)
                # Remplacer la puce Unicode par un caractère compatible
                safe_item = str(item).encode('latin-1', 'replace').decode('latin-1')
                self.cell(60, 6, f"- {safe_item}", 0, 0)  # Utiliser '-' au lieu de '•'
            self.ln(8)
        else:
            # Pour le texte normal
            if isinstance(content, list):
                content = "\n".join(content)
            # Nettoyer tous les caractères Unicode problématiques
            safe_content = str(content).encode('latin-1', 'replace').decode('latin-1')
            self.multi_cell(0, 6, safe_content)
            self.ln(3)

def process_photo(photo_data):
    """Traite la photo base64 et la sauvegarde temporairement"""
    if not photo_data or not photo_data.startswith('data:image'):
        print("Pas de photo ou format invalide")
        return None
        
    try:
        print("Début traitement photo...")
        # Extraire les données base64
        header, data = photo_data.split(',', 1)
        image_data = base64.b64decode(data)
        print(f"Photo décodée: {len(image_data)} bytes")
        
        # Créer une image PIL
        image = Image.open(io.BytesIO(image_data))
        print(f"Image PIL créée: {image.size}")
        
        # Redimensionner l'image (carré de 300x300 max)
        image = image.convert('RGB')
        image.thumbnail((300, 300), Image.Resampling.LANCZOS)
        
        # Créer une image carrée
        size = min(image.size)
        left = (image.width - size) // 2
        top = (image.height - size) // 2
        image = image.crop((left, top, left + size, top + size))
        
        # Sauvegarder temporairement
        photo_path = os.path.join(IMAGES_FOLDER, 'temp_photo.jpg')
        image.save(photo_path, 'JPEG', quality=85)
        print(f"Photo sauvegardée: {photo_path}")
        
        return photo_path
    except Exception as e:
        print(f"Erreur traitement photo: {e}")
        traceback.print_exc()
        return None

@app.route('/generate-cv', methods=['POST'])
def generate_cv():
    try:
        print("=== DÉBUT GÉNÉRATION CV ===")
        
        # Vérifier le Content-Type
        if not request.is_json:
            print(f"Content-Type invalide: {request.content_type}")
            return jsonify({'error': 'Content-Type doit être application/json'}), 400
            
        data = request.json
        if not data:
            print("Aucune donnée reçue")
            return jsonify({'error': 'Aucune donnée reçue'}), 400
            
        print(f"Données reçues: {list(data.keys())}")
        
        # Validation des champs obligatoires
        name = data.get('name', '').strip()
        if not name:
            print("Nom manquant")
            return jsonify({'error': 'Le nom est obligatoire'}), 400
            
        print(f"Génération CV pour: {name}")
        
        pdf = ModernPDF()
        pdf.add_page()
        
        # Traiter la photo si présente
        photo_path = None
        if 'photo' in data and data['photo']:
            print("Photo détectée, traitement...")
            photo_path = process_photo(data['photo'])
        
        # Informations personnelles
        email = data.get('email', '')
        phone = data.get('phone', '')
        address = data.get('address', '')
        
        print(f"Ajout infos personnelles: {name}, {email}, {phone}")
        pdf.add_personal_info(name, email, phone, address, photo_path)
        
        # Formation
        education_data = data.get('education', [])
        print(f"Formation: {len(education_data)} entrées")
        if education_data and isinstance(education_data, list):
            valid_education = [edu for edu in education_data if isinstance(edu, dict) and 
                             any(edu.get(field, '').strip() for field in ['degree', 'school', 'year'])]
            
            if valid_education:
                pdf.add_colored_section('FORMATION', 46, 204, 113)
                for edu in valid_education:
                    education_text = []
                    if edu.get('degree', '').strip():
                        education_text.append(f"Diplôme: {edu['degree']}")
                    if edu.get('school', '').strip():
                        education_text.append(f"École: {edu['school']}")
                    if edu.get('year', '').strip():
                        education_text.append(f"Année: {edu['year']}")
                    
                    if education_text:
                        pdf.add_section_content("\n".join(education_text))
        
        # Expérience professionnelle
        experience_data = data.get('experience', [])
        print(f"Expérience: {len(experience_data)} entrées")
        if experience_data and isinstance(experience_data, list):
            valid_experience = [exp for exp in experience_data if isinstance(exp, dict) and 
                              any(exp.get(field, '').strip() for field in ['position', 'company', 'start', 'end'])]
            
            if valid_experience:
                pdf.add_colored_section('EXPÉRIENCE PROFESSIONNELLE', 155, 89, 182)
                for exp in valid_experience:
                    exp_text = []
                    
                    # Titre du poste et entreprise
                    position = exp.get('position', '').strip()
                    company = exp.get('company', '').strip()
                    if position and company:
                        exp_text.append(f"{position} - {company}")
                    elif position:
                        exp_text.append(position)
                    elif company:
                        exp_text.append(company)
                    
                    # Période
                    start = exp.get('start', '').strip()
                    end = exp.get('end', '').strip()
                    if start or end:
                        period = f"Période: {start} - {end if end else 'Présent'}"
                        exp_text.append(period)
                    
                    # Détails
                    details = exp.get('details', '').strip()
                    if details:
                        exp_text.append(f"Responsabilités: {details}")
                    
                    if exp_text:
                        pdf.add_section_content("\n".join(exp_text))
                        pdf.ln(2)
        
        # Compétences
        skills_data = data.get('skills', [])
        print(f"Compétences: {len(skills_data)} entrées")
        if skills_data and isinstance(skills_data, list) and skills_data:
            pdf.add_colored_section('COMPÉTENCES', 230, 126, 34)
            pdf.add_section_content(skills_data, is_list=True)
        
        # Langues
        languages_data = data.get('languages', [])
        print(f"Langues: {len(languages_data)} entrées")
        if languages_data and isinstance(languages_data, list) and languages_data:
            pdf.add_colored_section('LANGUES', 52, 152, 219)
            pdf.add_section_content(languages_data, is_list=True)
        
        # Aptitudes
        aptitudes_data = data.get('aptitudes', [])
        print(f"Aptitudes: {len(aptitudes_data)} entrées")
        if aptitudes_data and isinstance(aptitudes_data, list) and aptitudes_data:
            pdf.add_colored_section('APTITUDES', 231, 76, 60)
            pdf.add_section_content(aptitudes_data, is_list=True)
        
        # Sauvegarder le PDF
        filename = f"cv_{name.replace(' ', '_').lower()}.pdf"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        
        print(f"Sauvegarde PDF: {file_path}")
        pdf.output(file_path)
        
        # Vérifier que le fichier a été créé
        if not os.path.exists(file_path):
            print("Erreur: fichier PDF non créé")
            return jsonify({'error': 'Erreur lors de la création du fichier PDF'}), 500
            
        file_size = os.path.getsize(file_path)
        print(f"PDF créé avec succès: {file_size} bytes")
        
        # Nettoyer l'image temporaire
        if photo_path and os.path.exists(photo_path):
            try:
                os.remove(photo_path)
                print("Image temporaire supprimée")
            except Exception as e:
                print(f"Erreur suppression image: {e}")
        
        print("=== ENVOI FICHIER ===")
        return send_file(file_path, as_attachment=True, download_name=filename)
        
    except Exception as e:
        print(f"ERREUR GÉNÉRATION CV: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors de la génération du CV: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'Service CV Generator fonctionne'})

if __name__ == '__main__':
    print("Démarrage du serveur CV Generator...")
    print("URL: http://localhost:5000")
    print("CORS configuré pour: http://localhost:3000")
    app.run(debug=True, host='0.0.0.0', port=5000)