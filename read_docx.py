import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path, 'r') as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # The namespaces are usually standard in docx
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            # Find all text elements
            texts = tree.findall('.//w:t', namespaces)
            
            extracted_text = []
            for text in texts:
                if text.text:
                    extracted_text.append(text.text)
                    
            with open('D:\\hackerthon\\docx_content.md', 'w', encoding='utf-8') as f:
                f.write(''.join(extracted_text))
            print("Extracted successfully to docx_content.md")
    except Exception as e:
        print(f"Error reading docx: {e}")

extract_text_from_docx('D:\\Hackathon_AIDEV_2026_ChungKet_DeThi_Final.docx')
