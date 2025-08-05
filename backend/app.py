from flask import Flask, request, send_file, jsonify
from fpdf import FPDF
import os
from flask_cors import CORS
import base64
import io
from PIL import Image, ImageDraw
import traceback

app = Flask(__name__)
CORS(app, resources={
    r"/generate-cv": {"origins": ["http://localhost:3001"]},
    r"/health": {"origins": ["http://localhost:3001"]}
})

UPLOAD_FOLDER = 'generated_cvs'
IMAGES_FOLDER = 'temp_images'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(IMAGES_FOLDER, exist_ok=True)

class ModernCanvaPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)
        # Couleurs du thème moderne
        self.primary_color = (47, 54, 64)      # Gris foncé élégant
        self.accent_color = (72, 201, 176)     # Vert menthe moderne
        self.secondary_color = (116, 185, 255) # Bleu clair
        self.text_dark = (45, 52, 54)          # Gris très foncé
        self.text_light = (99, 110, 114)       # Gris moyen
        self.bg_light = (245, 246, 250)        # Gris très clair
        
    def create_rounded_rect(self, x, y, w, h, r, style='F'):
        """Crée un rectangle simple (sans coins arrondis pour FPDF standard)"""
        self.rect(x, y, w, h, style)
    
    def add_gradient_header(self):
        """Ajoute un en-tête avec effet dégradé simulé"""
        # Bande principale
        self.set_fill_color(*self.primary_color)
        self.rect(0, 0, 210, 60, 'F')
        
        # Effet de superposition pour simuler un dégradé avec plusieurs bandes
        for i in range(5):
            alpha_effect = 255 - (i * 30)  # Effet de dégradé simulé
            color_mix = tuple(min(255, int(c + (72-c) * i/5)) for c in self.primary_color)
            self.set_fill_color(*color_mix)
            self.rect(0, 40 + i*4, 210, 4, 'F')
        
        # Forme géométrique décorative simple
        self.set_fill_color(255, 255, 255)
        # Triangle décoratif simplifié avec des lignes
        self.set_draw_color(255, 255, 255)
        self.set_line_width(2)
        self.line(180, 10, 200, 30)
        self.line(200, 30, 190, 50)
        self.line(190, 50, 180, 10)
    
    def draw_circle_simple(self, x, y, r, style='F'):
        """Dessine un cercle simplifié avec un carré"""
        # Pour FPDF standard, on utilise un petit carré comme approximation
        self.rect(x-r/2, y-r/2, r, r, style)
    
    def polygon(self, points, style='F'):
        """Dessine un polygone simple avec des lignes"""
        if len(points) < 3:
            return
        # Connecter tous les points avec des lignes
        for i in range(len(points)):
            next_i = (i + 1) % len(points)
            self.line(points[i][0], points[i][1], points[next_i][0], points[next_i][1])
    
    def add_profile_section(self, name, title, email, phone, address, photo_path=None):
        """Section profil avec design moderne Canva-style"""
        self.add_gradient_header()
        
        # Position de départ pour le contenu
        start_y = 20
        
        if photo_path and os.path.exists(photo_path):
            # Photo de profil avec cadre moderne
            try:
                # Créer un cadre blanc pour la photo
                self.set_fill_color(255, 255, 255)
                self.rect(20, start_y + 2, 30, 30, 'F')  # Fond blanc
                
                # Ajouter la photo par-dessus
                self.image(photo_path, 22, start_y + 4, 26, 26)
                
                # Informations à droite de la photo
                text_x = 60
            except Exception as e:
                print(f"Erreur photo: {e}")
                text_x = 20
        else:
            text_x = 20
        
        # Nom avec style moderne
        self.set_xy(text_x, start_y)
        self.set_font('Arial', 'B', 22)
        self.set_text_color(255, 255, 255)
        self.cell(0, 12, name.encode('latin-1', 'replace').decode('latin-1'))
        
        # Titre/poste
        if title:
            self.set_xy(text_x, start_y + 12)
            self.set_font('Arial', '', 12)
            self.set_text_color(240, 240, 240)
            self.cell(0, 8, title.encode('latin-1', 'replace').decode('latin-1'))
        
        # Informations de contact avec icônes simulées
        contact_y = start_y + 25
        self.set_font('Arial', '', 9)
        self.set_text_color(230, 230, 230)
        
        contacts = []
        if email:
            contacts.append(f"@ {email}")
        if phone:
            contacts.append(f"T {phone}")
        if address:
            contacts.append(f"A {address}")
        
        for i, contact in enumerate(contacts):
            self.set_xy(text_x, contact_y + i * 4)
            self.cell(0, 4, contact.encode('latin-1', 'replace').decode('latin-1'))
    
    def add_modern_section(self, title, icon="", y_position=None):
        """Ajoute une section avec design moderne"""
        if y_position:
            self.set_y(y_position)
        else:
            self.ln(8)
        
        current_y = self.get_y()
        
        # Barre colorée à gauche
        self.set_fill_color(*self.accent_color)
        self.rect(10, current_y, 3, 8, 'F')
        
        # Titre de section
        self.set_xy(18, current_y)
        self.set_font('Arial', 'B', 14)
        self.set_text_color(*self.primary_color)
        section_title = f"{icon} {title}" if icon else title
        self.cell(0, 8, section_title.encode('latin-1', 'replace').decode('latin-1'))
        
        # Ligne décorative
        self.set_draw_color(*self.accent_color)
        self.set_line_width(0.5)
        self.line(18, current_y + 10, 190, current_y + 10)
        
        self.ln(15)
    
    def add_experience_item(self, position, company, period, description):
        """Ajoute un élément d'expérience avec design moderne"""
        current_y = self.get_y()
        
        # Puce moderne (petit carré au lieu d'un cercle)
        self.set_fill_color(*self.secondary_color)
        self.rect(13, current_y + 2, 4, 4, 'F')
        
        # Poste et entreprise
        self.set_xy(20, current_y)
        self.set_font('Arial', 'B', 11)
        self.set_text_color(*self.text_dark)
        
        if position and company:
            title_text = f"{position} - {company}"
        elif position:
            title_text = position
        elif company:
            title_text = company
        else:
            title_text = "Expérience"
            
        self.cell(0, 6, title_text.encode('latin-1', 'replace').decode('latin-1'))
        
        # Période
        if period:
            self.set_xy(20, current_y + 6)
            self.set_font('Arial', 'I', 9)
            self.set_text_color(*self.text_light)
            self.cell(0, 5, period.encode('latin-1', 'replace').decode('latin-1'))
        
        # Description
        if description:
            self.set_xy(20, current_y + 12)
            self.set_font('Arial', '', 9)
            self.set_text_color(*self.text_dark)
            # Limiter la description à 3 lignes
            desc_lines = description.split('\n')[:3]
            for i, line in enumerate(desc_lines):
                if i > 0:
                    self.set_xy(20, current_y + 12 + i * 4)
                safe_line = line.encode('latin-1', 'replace').decode('latin-1')
                # Couper la ligne si trop longue
                if len(safe_line) > 80:
                    safe_line = safe_line[:77] + "..."
                self.cell(0, 4, safe_line)
        
        self.ln(20)
    
    def add_education_item(self, degree, school, year):
        """Ajoute un élément de formation"""
        current_y = self.get_y()
        
        # Puce moderne (petit carré)
        self.set_fill_color(*self.accent_color)
        self.rect(13, current_y + 2, 4, 4, 'F')
        
        # Diplôme
        if degree:
            self.set_xy(20, current_y)
            self.set_font('Arial', 'B', 11)
            self.set_text_color(*self.text_dark)
            self.cell(0, 6, degree.encode('latin-1', 'replace').decode('latin-1'))
        
        # École et année
        details = []
        if school:
            details.append(school)
        if year:
            details.append(year)
        
        if details:
            self.set_xy(20, current_y + 6)
            self.set_font('Arial', '', 9)
            self.set_text_color(*self.text_light)
            detail_text = " - ".join(details)
            self.cell(0, 5, detail_text.encode('latin-1', 'replace').decode('latin-1'))
        
        self.ln(15)
    
    def add_skills_grid(self, skills, columns=3):
        """Ajoute les compétences en grille moderne"""
        if not skills:
            return
            
        current_y = self.get_y()
        col_width = 60
        row_height = 8
        
        for i, skill in enumerate(skills):
            col = i % columns
            row = i // columns
            
            x = 20 + col * col_width
            y = current_y + row * row_height
            
            # Fond coloré pour chaque compétence
            self.set_fill_color(*self.bg_light)
            skill_text = skill.encode('latin-1', 'replace').decode('latin-1')
            
            # Rectangle avec largeur adaptée au texte
            text_width = len(skill_text) * 2 + 8
            self.rect(x, y, text_width, 6, 'F')
            
            # Texte de la compétence
            self.set_xy(x + 2, y + 1)
            self.set_font('Arial', '', 9)
            self.set_text_color(*self.text_dark)
            self.cell(0, 4, skill_text)
        
        # Calculer l'espace nécessaire
        rows_needed = (len(skills) + columns - 1) // columns
        self.set_y(current_y + rows_needed * row_height + 5)
    
    def draw_circle_simple(self, x, y, r, style='F'):
        """Dessine un cercle simplifié avec un carré"""
        # Pour FPDF standard, on utilise un petit carré comme approximation
        self.rect(x-r/2, y-r/2, r, r, style)
    
    def set_alpha(self, alpha):
        """Simule la transparence (ne fonctionne pas vraiment avec FPDF)"""
        # Cette fonction est là pour la compatibilité mais FPDF ne supporte pas vraiment la transparence
        pass

def process_photo(photo_data):
    """Traite la photo pour un style moderne"""
    if not photo_data or not photo_data.startswith('data:image'):
        return None
        
    try:
        header, data = photo_data.split(',', 1)
        image_data = base64.b64decode(data)
        
        # Créer une image PIL
        image = Image.open(io.BytesIO(image_data))
        image = image.convert('RGB')
        
        # Redimensionner en carré
        size = 200
        image = image.resize((size, size), Image.Resampling.LANCZOS)
        
        # Créer un masque circulaire
        mask = Image.new('L', (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)
        
        # Appliquer le masque circulaire
        output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        output.paste(image, (0, 0))
        output.putalpha(mask)
        
        # Convertir en RGB avec fond blanc
        final_image = Image.new('RGB', (size, size), (255, 255, 255))
        final_image.paste(output, (0, 0), output)
        
        # Sauvegarder
        photo_path = os.path.join(IMAGES_FOLDER, 'modern_photo.jpg')
        final_image.save(photo_path, 'JPEG', quality=90)
        
        return photo_path
    except Exception as e:
        print(f"Erreur traitement photo: {e}")
        return None

@app.route('/generate-cv', methods=['POST'])
def generate_cv():
    try:
        print("=== GÉNÉRATION CV MODERNE ===")
        
        if not request.is_json:
            return jsonify({'error': 'Content-Type doit être application/json'}), 400
            
        data = request.json
        if not data:
            return jsonify({'error': 'Aucune donnée reçue'}), 400
        
        # Validation
        name = data.get('name', '').strip()
        if not name:
            return jsonify({'error': 'Le nom est obligatoire'}), 400
        
        print(f"Génération CV moderne pour: {name}")
        
        # Créer le PDF moderne
        pdf = ModernCanvaPDF()
        pdf.add_page()
        
        # Traiter la photo
        photo_path = None
        if 'photo' in data and data['photo']:
            photo_path = process_photo(data['photo'])
        
        # Section profil
        title = data.get('title', 'Professionnel')  # Utiliser le titre depuis les données ou par défaut
        pdf.add_profile_section(
            name=name,
            title=title,
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            photo_path=photo_path
        )
        
        # Expérience professionnelle
        experience_data = data.get('experience', [])
        if experience_data:
            valid_experience = [exp for exp in experience_data if isinstance(exp, dict) and 
                              any(exp.get(field, '').strip() for field in ['position', 'company', 'start', 'end'])]
            
            if valid_experience:
                pdf.add_modern_section('EXPÉRIENCE PROFESSIONNELLE', '💼')
                
                for exp in valid_experience:
                    position = exp.get('position', '').strip()
                    company = exp.get('company', '').strip()
                    start = exp.get('start', '').strip()
                    end = exp.get('end', '').strip()
                    
                    period = ""
                    if start or end:
                        period = f"{start} - {end if end else 'Présent'}"
                    
                    pdf.add_experience_item(
                        position=position,
                        company=company,
                        period=period,
                        description=exp.get('details', '').strip()
                    )
        
        # Formation
        education_data = data.get('education', [])
        if education_data:
            valid_education = [edu for edu in education_data if isinstance(edu, dict) and 
                             any(edu.get(field, '').strip() for field in ['degree', 'school', 'year'])]
            
            if valid_education:
                pdf.add_modern_section('FORMATION', '🎓')
                
                for edu in valid_education:
                    pdf.add_education_item(
                        degree=edu.get('degree', '').strip(),
                        school=edu.get('school', '').strip(),
                        year=edu.get('year', '').strip()
                    )
        
        # Compétences
        skills_data = data.get('skills', [])
        if skills_data and isinstance(skills_data, list) and skills_data:
            pdf.add_modern_section('COMPÉTENCES', '⚡')
            pdf.add_skills_grid(skills_data)
        
        # Langues
        languages_data = data.get('languages', [])
        if languages_data and isinstance(languages_data, list) and languages_data:
            pdf.add_modern_section('LANGUES', '🌍')
            pdf.add_skills_grid(languages_data, columns=2)
        
        # Aptitudes
        aptitudes_data = data.get('aptitudes', [])
        if aptitudes_data and isinstance(aptitudes_data, list) and aptitudes_data:
            pdf.add_modern_section('APTITUDES', '⭐')
            pdf.add_skills_grid(aptitudes_data, columns=2)
        
        # Sauvegarder
        filename = f"cv_moderne_{name.replace(' ', '_').lower()}.pdf"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        
        pdf.output(file_path)
        
        # Vérification
        if not os.path.exists(file_path):
            return jsonify({'error': 'Erreur lors de la création du fichier PDF'}), 500
        
        # Nettoyer l'image temporaire
        if photo_path and os.path.exists(photo_path):
            try:
                os.remove(photo_path)
            except Exception as e:
                print(f"Erreur suppression image: {e}")
        
        print(f"CV moderne généré: {filename}")
        return send_file(file_path, as_attachment=True, download_name=filename)
        
    except Exception as e:
        print(f"ERREUR: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Erreur lors de la génération: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'OK', 'message': 'Générateur CV Moderne actif'})

if __name__ == '__main__':
    print("Démarrage du générateur CV moderne...")
    print("Design inspiré de Canva avec mise en page professionnelle")
    app.run(debug=True, host='0.0.0.0', port=5000)