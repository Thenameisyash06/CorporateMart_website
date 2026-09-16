# CorporateMart Funding Schemes Importer / Updater
# Usage: python update_schemes.py [optional_excel_file.xlsx]

import os
import sys
import glob
import json
import zipfile
import datetime
import re
import xml.etree.ElementTree as ET

def excel_date(val):
    if not val:
        return 'Rolling / Ongoing'
    try:
        num = float(val)
        dt = datetime.datetime(1899, 12, 30) + datetime.timedelta(days=num)
        return dt.strftime('%d %B %Y')
    except Exception:
        v = str(val).strip()
        if not v or v.lower() in ['roll on', 'roll-on', 'rolling']:
            return 'Rolling / Ongoing'
        v = re.sub(r'septeber', 'September', v, flags=re.IGNORECASE)
        return v

def clean_entity(val):
    if not val:
        return 'Pvt Ltd / LLP / OPC / Registered Firm'
    v = str(val).strip()
    table = str.maketrans(
        "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇",
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    )
    v = v.translate(table)
    v = v.strip('() ')
    if 'section 8' in v.lower():
        return 'Section 8 Company / NGO'
    if 'only individual' in v.lower():
        return 'Individual Entrepreneurs'
    if 'subsidy 15 to 35' in v.lower():
        return 'Individual / Proprietary (15%–35% Subsidy)'
    return v

def clean_text(val):
    if not val:
        return ''
    v = str(val).strip()
    table = str.maketrans(
        "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇",
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    )
    v = v.translate(table)
    return v

descriptions = {
    "Tide 2.0": "Technology Incubation and Development of Entrepreneurs (TIDE 2.0) by MeitY promotes tech entrepreneurship by providing financial and technical support to incubators supporting ICT startups.",
    "Seed Support Scheme": "Seed support scheme providing debt/equity financing to early-stage startups with innovative ideas and technologies through recognized technology business incubators.",
    "PMEGP": "Prime Minister's Employment Generation Programme (PMEGP) offers credit-linked subsidies up to 35% to set up micro-enterprises in non-farm manufacturing and service sectors.",
    "NAIF Scheme": "National Agricultural Innovation Foundation (NAIF) scheme supports agri-entrepreneurs, farmers, and agribusiness startups with financial assistance, incubation, and commercialization guidance.",
    "Mudra Loan": "Pradhan Mantri MUDRA Yojana (PMMY) provides collateral-free institutional credit up to ₹20 Lakh to non-corporate, non-farm micro and small enterprises across Shishu, Kishore, and Tarun categories.",
    "Government of Gujarat Startup Scheme": "Gujarat Industrial Policy financial assistance for startups offering seed support, sustenance allowance of ₹20,000/month (₹25,000 for women), prototype grants, and marketing assistance.",
    "ACT Grants": "Action, Co-operation and Transformation (ACT) Grants provides non-dilutive grant capital to social impact startups and NGOs tackling India’s systemic challenges in healthcare, climate, and education.",
    "Growth Grant": "Growth Grants offer catalytic non-dilutive grant capital to student and student-founded startups to accelerate market expansion, pilot validation, and enterprise hiring.",
    "Young Innovators Grant": "Early-stage grant initiative supporting student innovators and university-led startups turning scientific research and innovative prototypes into market-ready ventures.",
    "CGTMSE": "Credit Guarantee Fund Trust for Micro and Small Enterprises provides third-party credit guarantee coverage up to ₹5 Crore for collateral-free term loans and working capital facilities.",
    "Avaana – Startup India Deep Tech Grand Challenge 2025–26": "Joint initiative by Avaana Capital and Startup India to empower early-stage deep-tech, climate-tech, and sustainability startups with up to ₹2.5 Crore in funding, strategic mentorship, and corporate pilot opportunities.",
    "RKVY-RAABI Programme 2026": "Rashtriya Krishi Vikas Yojana (RKVY-RAABI) grant programme by Ministry of Agriculture offering financial support to Agripreneurs and Agritech startups for scaling commercial agricultural products.",
    "STARTUP SEED SAMRIDH | Funding Opportunity": "MeitY SAMRIDH scheme provides matching funding and acceleration support to software product startups, helping them scale operations and secure commercial venture capital.",
    "Evolve-Tech": "Equity funding opportunity targeting high-growth tech-enabled startups across B2B SaaS, FinTech, Consumer Tech, and Enterprise Solutions ready for seed and pre-series A capital.",
    "GREENOVATION CHALLENGE": "National sustainability challenge providing high-impact grant funding to startups innovating in plastic waste management, textile recycling, food waste reduction, and circular economy.",
    "Womenpreneur for Bharat 4.0": "Specialized grant and mentorship program dedicated to empowering women founders building scalable startups across Tier 2 and Tier 3 cities across Bharat.",
    "CSR MEGA GRANTS": "Corporate Social Responsibility (CSR) grant pool connecting corporate foundations with Section 8 companies, NGOs, and social enterprises executing high-impact welfare programs.",
    "PM SVANIDHI STARTUP CHALLENGE": "MoHUA & Startup India initiative inviting startups to deploy technology-driven solutions for urban street vendors, including digital financial tools and eco-friendly packaging.",
    "CHIPMAT": "Strategic deep-tech semiconductor and hardware grant for startups developing cutting-edge silicon architectures, embedded systems, microelectronics, and advanced materials.",
    "AOP | AFBIC – Agri-Startup Incubation Program": "Agri-Business Incubation Centre (AFBIC) funding and acceleration program offering up to ₹25 Lakh for innovative agriculture, agri-tech, farm mechanization, and supply chain ventures.",
    "BIZLABS ACCELERATOR PROGRAMME": "Corporate accelerator offering equity-free grants, banking sandbox access, executive mentorship, and pilot opportunities with leading financial institutions.",
    "STARTUP LEAGUE 2026": "National venture league by Startup Stairs offering access to a ₹10 Crore equity investment pool, venture backing, and direct institutional investor matchmaking.",
    "Gujarat Innovators": "Dedicated state grant program nurturing homegrown innovators in Gujarat with prototype funding, patent subsidies, and academic incubator infrastructure.",
    "GLOBAL IMPACT FUND": "International catalytic grant fund investing in scalable Indian innovations addressing clean technology, healthcare access, agritech, robotics, and circular economy.",
    "Credit Guarantee Scheme for Startups (CGSS)": "DPIIT-operated credit guarantee scheme providing collateral-free loans up to ₹20 Crore per borrower for DPIIT-recognized startups through member lending institutions."
}

def main():
    excel_path = sys.argv[1] if len(sys.argv) > 1 else None
    if not excel_path:
        candidates = glob.glob("*Scheme*.xlsx")
        if candidates:
            excel_path = candidates[0]
        else:
            candidates = glob.glob("*.xlsx")
            if candidates:
                excel_path = candidates[0]

    if not excel_path or not os.path.exists(excel_path):
        print("Error: No Excel file found.")
        sys.exit(1)

    print(f"Reading schemes from: {excel_path}")
    with zipfile.ZipFile(excel_path) as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in tree.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                text_parts = [elem.text or '' for elem in si.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')]
                shared_strings.append(''.join(text_parts))

        tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        rows = []
        for row in tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_dict = {}
            for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                r = c.attrib.get('r')
                col_letter = ''.join([ch for ch in r if ch.isalpha()])
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = v.text if v is not None else ''
                t = c.attrib.get('t')
                if t == 's' and val:
                    val = shared_strings[int(val)]
                row_dict[col_letter] = val.strip()
            rows.append(row_dict)

    if len(rows) < 2:
        print("Error: Sheet has insufficient rows.")
        sys.exit(1)

    headers = rows[1]
    raw_data = []
    for r in rows[2:]:
        item = {headers.get(col, col): val for col, val in r.items() if headers.get(col)}
        if any(item.values()) and item.get('Scheme name'):
            raw_data.append(item)

    schemes = []
    for i, r in enumerate(raw_data):
        name = clean_text(r.get('Scheme name', ''))
        # Fix en-dash corruptions for Avaana and AOP
        if 'avaana' in name.lower():
            name = "Avaana – Startup India Deep Tech Grand Challenge 2025–26"
        elif 'aop' in name.lower() and 'afbic' in name.lower():
            name = "AOP | AFBIC – Agri-Startup Incubation Program"

        stage = clean_text(r.get('Stage', 'Idea'))
        ftype = clean_text(r.get('Funding Type', 'Grant'))
        amount = clean_text(r.get('Amount', ''))
        if not amount:
            amount = 'Grant Support Available'
        elif not any(char.isdigit() for char in amount):
            amount = amount.capitalize()

        deadline = excel_date(r.get('Deadline', ''))
        industry = clean_text(r.get('Industry', 'All sectors'))
        if not industry:
            industry = 'All Sectors'
        state = clean_text(r.get('State', 'All India'))
        founder = clean_text(r.get('Founder Type', 'All Founder Eligible'))
        entity = clean_entity(r.get('Entity Type', ''))
        prog_type = clean_text(r.get('Program Type', ''))
        regs = clean_text(r.get('Registrations', ''))
        if not regs:
            regs = 'No Mandatory Registration'

        desc = descriptions.get(name, f"Government & Institutional funding opportunity supporting eligible Indian startups in {industry} with {ftype.lower()} assistance up to {amount}.")

        amt_lower = amount.lower()
        amt_val = 0.0
        if 'cr' in amt_lower or 'crore' in amt_lower:
            nums = re.findall(r'[\d\.]+', amt_lower)
            if nums:
                amt_val = float(nums[-1]) * 10000000.0
        elif 'lakh' in amt_lower or 'lac' in amt_lower:
            nums = re.findall(r'[\d\.]+', amt_lower)
            if nums:
                amt_val = float(nums[-1]) * 100000.0

        scheme_obj = {
            "id": f"scheme-{i+1}",
            "name": name,
            "stage": stage,
            "fundingType": ftype,
            "amount": amount,
            "amountValue": amt_val,
            "deadline": deadline,
            "industry": industry,
            "state": state,
            "founderType": founder,
            "entityType": entity,
            "programType": prog_type,
            "registrations": regs,
            "description": desc
        }
        schemes.append(scheme_obj)

    out_js_path = "schemes-data.js"
    js_content = f"// Generated from {os.path.basename(excel_path)}\nconst SCHEMES_DATA = {json.dumps(schemes, indent=2, ensure_ascii=False)};\n"
    with open(out_js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"Success! Processed {len(schemes)} schemes with amounts, dates, and descriptions into {out_js_path}")

if __name__ == "__main__":
    main()
