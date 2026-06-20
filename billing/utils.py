import io
import math
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def format_indian_currency(val):
    if val is None:
        return "0.00"
    try:
        num = float(val)
    except ValueError:
        return "0.00"
    
    is_negative = num < 0
    num = abs(num)
    
    s = f"{num:.2f}"
    parts = s.split('.')
    whole = parts[0]
    fraction = parts[1]
    
    if len(whole) <= 3:
        res_whole = whole
    else:
        last3 = whole[-3:]
        remaining = whole[:-3]
        out = []
        while remaining:
            if len(remaining) > 2:
                out.append(remaining[-2:])
                remaining = remaining[:-2]
            else:
                out.append(remaining)
                remaining = ""
        out.reverse()
        res_whole = ",".join(out) + "," + last3
        
    if is_negative:
        res_whole = "-" + res_whole
        
    return f"{res_whole}.{fraction}"


def number_to_words_indian(num):
    if num is None:
        return ""
    
    # Clean float conversion and rounding to 2 decimals
    try:
        num = float(num)
    except ValueError:
        return ""
        
    whole = int(math.floor(num))
    paise = int(round((num - whole) * 100))
    
    def helper(n):
        units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
                 "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
        tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
        
        if n < 20:
            return units[n]
        elif n < 100:
            return tens[n // 10] + (" " + units[n % 10] if n % 10 != 0 else "")
        elif n < 1000:
            return units[n // 100] + " Hundred" + (" and " + helper(n % 100) if n % 100 != 0 else "")
        elif n < 100000:
            return helper(n // 1000) + " Thousand" + (" " + helper(n % 1000) if n % 1000 != 0 else "")
        elif n < 10000000:
            return helper(n // 100000) + " Lakh" + (" " + helper(n % 100000) if n % 100000 != 0 else "")
        else:
            return helper(n // 10000000) + " Crore" + (" " + helper(n % 10000000) if n % 10000000 != 0 else "")

    rupees_str = helper(whole)
    if not rupees_str or rupees_str.strip() == "":
        rupees_str = "Zero"
        
    paise_str = ""
    if paise > 0:
        paise_str = " and " + helper(paise) + " Paise"
        
    return f"{rupees_str} Rupees{paise_str} Only"


def _get_invoice_flowables(invoice, company, styles, title_style, company_name_style, company_details_style, cell_style_left, cell_style_left_bold, cell_style_right, cell_style_right_bold, cell_style_center, cell_style_center_bold):
    flowables = []
    
    # --- 1. HEADER SECTION ---
    comp_name = company.company_name if company else "COMPANY NAME"
    comp_address = company.address if company else "Address"
    comp_phone = company.phone if company else "Phone"
    comp_gst = company.gst_number if company else "GSTIN"
    comp_state = company.state_code if company else "24-GJ"
    comp_pan = company.pan_number if company else "PAN"
    
    addr_line = f"{comp_address} | Phone: {comp_phone}"
    gst_line = f"GSTIN: {comp_gst} | State Code: {comp_state} | PAN: {comp_pan}"
    
    header_data = [
        [Paragraph("|| Shree Ganeshay Namah ||", company_details_style)],
        [Paragraph("TAX INVOICE", title_style)],
        [Paragraph(comp_name.upper(), company_name_style)],
        [Paragraph(addr_line, company_details_style)],
        [Paragraph(gst_line, company_details_style)]
    ]
    
    header_table = Table(header_data, colWidths=[523])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    
    # --- 2. CUSTOMER & INVOICE DETAILS SECTION ---
    customer_data = [
        [
            Paragraph(f"<b>M/s:</b> {invoice.display_customer_name}", cell_style_left),
            Paragraph(f"<b>Bill No:</b> {invoice.bill_number or '-'}", cell_style_left)
        ],
        [
            Paragraph(f"<b>Address:</b> {invoice.display_customer_address}", cell_style_left),
            Paragraph(f"<b>Bill Date:</b> {invoice.bill_date.strftime('%d/%m/%Y')}", cell_style_left)
        ],
        [
            Paragraph("", cell_style_left),  # Spanned from above Address cell
            Paragraph(f"<b>Cha. No:</b> {invoice.challan_no or ''}", cell_style_left)
        ],
        [
            Paragraph(f"<b>GSTIN:</b> {invoice.display_customer_gst_number}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>State Code:</b> {comp_state}", cell_style_left),
            Paragraph(f"<b>HSN Code:</b> {invoice.hsn_code or ''}", cell_style_left)
        ],
        [
            Paragraph(f"<b>Broker:</b> {invoice.broker or ''}", cell_style_left),
            Paragraph("", cell_style_left)
        ]
    ]
    
    # Widths sum to exactly 523 (300 + 223)
    detail_table = Table(customer_data, colWidths=[300, 223])
    detail_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('LINEBEFORE', (1,0), (1,-1), 1, colors.black),  # Division line between columns
        ('SPAN', (0, 1), (0, 2)),                       # Span Address across rows 1 and 2
    ]))
    
    # --- 3. PRODUCT TABLE ---
    prod_headers = [
        Paragraph("<b>No</b>", cell_style_center_bold),
        Paragraph("<b>P.Ch.No</b>", cell_style_center_bold),
        Paragraph("<b>Lot No</b>", cell_style_center_bold),
        Paragraph("<b>DESIGN</b>", cell_style_left_bold),
        Paragraph("<b>METER</b>", cell_style_right_bold),
        Paragraph("<b>T.QTY</b>", cell_style_right_bold),
        Paragraph("<b>P.QTY</b>", cell_style_right_bold),
        Paragraph("<b>S.QTY</b>", cell_style_right_bold),
        Paragraph("<b>QTY</b>", cell_style_right_bold),
        Paragraph("<b>Rate</b>", cell_style_right_bold),
        Paragraph("<b>Amount</b>", cell_style_right_bold),
    ]
    
    prod_widths = [20, 48, 45, 75, 45, 40, 40, 40, 45, 50, 75] # Sums to exactly 523
    
    prod_rows = [prod_headers]
    
    tot_meter = 0
    tot_t_qty = 0
    tot_p_qty = 0
    tot_s_qty = 0
    tot_qty = 0
    
    num_items = invoice.items.count()
    for idx, item in enumerate(invoice.items.all(), start=1):
        prod_rows.append([
            Paragraph(str(idx), cell_style_center),
            Paragraph(item.p_ch_no or '', cell_style_center),
            Paragraph(item.lot_no or '', cell_style_center),
            Paragraph(item.design or '', cell_style_left),
            Paragraph(format_indian_currency(item.meter), cell_style_right),
            Paragraph(f"{int(item.t_qty)}" if item.t_qty % 1 == 0 else format_indian_currency(item.t_qty), cell_style_right),
            Paragraph(f"{int(item.p_qty)}" if item.p_qty % 1 == 0 else format_indian_currency(item.p_qty), cell_style_right),
            Paragraph(f"{int(item.s_qty)}" if item.s_qty % 1 == 0 else format_indian_currency(item.s_qty), cell_style_right),
            Paragraph(f"{int(item.qty)}" if item.qty % 1 == 0 else format_indian_currency(item.qty), cell_style_right),
            Paragraph(format_indian_currency(item.rate), cell_style_right),
            Paragraph(format_indian_currency(item.amount), cell_style_right),
        ])
        tot_meter += float(item.meter)
        tot_t_qty += float(item.t_qty)
        tot_p_qty += float(item.p_qty)
        tot_s_qty += float(item.s_qty)
        tot_qty += float(item.qty)
        
    # 1. Create a temporary product table to measure height without the blank space
    prod_rows_temp = [prod_headers] + prod_rows[1:]  # copy headers and items
    # Totals/PAN row for measurement
    prod_rows_temp.append([
        Paragraph("<b>PAN NO:</b>", cell_style_left_bold),
        Paragraph(comp_pan, cell_style_left),
        Paragraph("", cell_style_center),
        Paragraph("", cell_style_left),
        Paragraph(f"<b>{format_indian_currency(tot_meter)}</b>", cell_style_right_bold),
        Paragraph(f"<b>{int(tot_t_qty)}</b>" if tot_t_qty % 1 == 0 else f"<b>{format_indian_currency(tot_t_qty)}</b>", cell_style_right_bold),
        Paragraph(f"<b>{int(tot_p_qty)}</b>" if tot_p_qty % 1 == 0 else f"<b>{format_indian_currency(tot_p_qty)}</b>", cell_style_right_bold),
        Paragraph(f"<b>{int(tot_s_qty)}</b>" if tot_s_qty % 1 == 0 else f"<b>{format_indian_currency(tot_s_qty)}</b>", cell_style_right_bold),
        Paragraph(f"<b>{int(tot_qty)}</b>" if tot_qty % 1 == 0 else f"<b>{format_indian_currency(tot_qty)}</b>", cell_style_right_bold),
        Paragraph("", cell_style_right),
        Paragraph(f"<b>{format_indian_currency(invoice.gross_amount)}</b>", cell_style_right_bold),
    ])
    
    temp_totals_row_idx = num_items + 1
    prod_table_temp = Table(prod_rows_temp, colWidths=prod_widths, repeatRows=1)
    prod_table_temp.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 2),
        ('INNERGRID', (0,0), (-1, num_items), 0.5, colors.black),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.black),
        ('SPAN', (0, temp_totals_row_idx), (1, temp_totals_row_idx)),
        ('LINEABOVE', (0, temp_totals_row_idx), (-1, temp_totals_row_idx), 1, colors.black),
        ('LINEBEFORE', (1, temp_totals_row_idx), (-1, temp_totals_row_idx), 0.5, colors.black),
    ]))
    
    # 2. Build bottom sections to wrap and measure
    bank_details_html = (
        f"<b>Bank Details:</b><br/>"
        f"Bank Name: {company.bank_name if company else ''}<br/>"
        f"Bank A/c No: {company.account_number if company else ''}<br/>"
        f"Bank IFSC Code: {company.ifsc_code if company else ''}"
    )
    terms_list = (company.terms_conditions if company else "").split('\n')
    terms_html = "<b>Terms & Conditions:</b><br/>" + "<br/>".join(terms_list)
    left_cell_paragraphs = [
        Paragraph(bank_details_html, cell_style_left),
        Spacer(1, 6),
        Paragraph(terms_html, cell_style_left)
    ]
    grand_total_style_left = ParagraphStyle(
        'GrandTotalLeft', parent=cell_style_left_bold, fontSize=10, textColor=colors.HexColor('#198754'), leading=12
    )
    grand_total_style_right = ParagraphStyle(
        'GrandTotalRight', parent=cell_style_right_bold, fontSize=10, textColor=colors.HexColor('#198754'), leading=12
    )
    calc_rows = [
        [Paragraph("DISCOUNT", cell_style_left), Paragraph(f"{invoice.discount_percent:.2f}%", cell_style_right), Paragraph(format_indian_currency(invoice.discount_amount), cell_style_right)],
        [Paragraph("BLOUSE CHARGE", cell_style_left), Paragraph("", cell_style_right), Paragraph(format_indian_currency(invoice.blouse_charge), cell_style_right)],
        [Paragraph("SUB TOTAL", cell_style_left_bold), Paragraph("", cell_style_right), Paragraph(format_indian_currency(invoice.subtotal), cell_style_right_bold)],
        [Paragraph("SGST", cell_style_left), Paragraph(f"{invoice.sgst_percent:.2f}%", cell_style_right), Paragraph(format_indian_currency(invoice.sgst_amount), cell_style_right)],
        [Paragraph("CGST", cell_style_left), Paragraph(f"{invoice.cgst_percent:.2f}%", cell_style_right), Paragraph(format_indian_currency(invoice.cgst_amount), cell_style_right)],
        [Paragraph("R.OFF", cell_style_left), Paragraph("", cell_style_right), Paragraph(format_indian_currency(invoice.round_off), cell_style_right)],
        [Paragraph("GRAND TOTAL", grand_total_style_left), Paragraph("", cell_style_right), Paragraph(format_indian_currency(invoice.grand_total), grand_total_style_right)],
    ]
    calc_table = Table(calc_rows, colWidths=[90, 50, 83])
    calc_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    bottom_master_table = Table([[left_cell_paragraphs, calc_table]], colWidths=[300, 223])
    bottom_master_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (0,-1), 4),
        ('BOTTOMPADDING', (0,0), (0,-1), 4),
        ('LEFTPADDING', (0,0), (0,-1), 6),
        ('RIGHTPADDING', (0,0), (0,-1), 6),
        ('TOPPADDING', (1,0), (1,-1), 0),
        ('BOTTOMPADDING', (1,0), (1,-1), 0),
        ('LEFTPADDING', (1,0), (1,-1), 0),
        ('RIGHTPADDING', (1,0), (1,-1), 0),
        ('LINEBEFORE', (1,0), (1,-1), 1, colors.black),
    ]))
    
    # --- 5. AMOUNT IN WORDS SECTION ---
    words_data = [
        [
            Paragraph(f"<b>In Words:</b> {invoice.amount_in_words}", cell_style_left_bold),
            Paragraph(f"<b>{format_indian_currency(invoice.grand_total)}</b>", grand_total_style_right)
        ]
    ]
    words_table = Table(words_data, colWidths=[423, 100])
    words_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('LINEBEFORE', (1,0), (1,-1), 1, colors.black),
    ]))
    
    # --- 7. AUTHORISED SIGNATORY BLOCK ---
    sign_data = [
        [
            Paragraph("", cell_style_left),
            Paragraph(f"For, <b>{comp_name.upper()}</b><br/><br/><br/><br/>Authorised Signatory", ParagraphStyle(
                'SignStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=8, alignment=TA_RIGHT, leading=10
            ))
        ]
    ]
    sign_table = Table(sign_data, colWidths=[250, 273])
    sign_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    
    # Measure heights of all sections to calculate the dynamic blank area height
    _, h_header = header_table.wrap(523, 1000)
    _, h_detail = detail_table.wrap(523, 1000)
    _, h_prod_temp = prod_table_temp.wrap(523, 1000)
    _, h_bottom = bottom_master_table.wrap(523, 1000)
    _, h_words = words_table.wrap(523, 1000)
    _, h_sign = sign_table.wrap(523, 1000)
    
    h_spacer = 15
    # Target height for master_table + Spacer + sign_table is 730 points (~94.8% of 769.89 printable height)
    H_target = 730.0
    h_blank = H_target - (h_header + h_detail + h_prod_temp + h_bottom + h_words + h_spacer + h_sign)
    h_blank = max(0.0, h_blank)
    
    # 3. Construct final product table with the blank writing area row
    prod_rows.append(["", "", "", "", "", "", "", "", "", "", ""])
    blank_row_idx = num_items + 1
    
    prod_rows.append([
        Paragraph("<b>PAN NO:</b>", cell_style_left_bold),
        Paragraph(comp_pan, cell_style_left),
        Paragraph("", cell_style_center),
        Paragraph("", cell_style_left),
        Paragraph(f"<b>{format_indian_currency(tot_meter)}</b>", cell_style_right_bold),
        Paragraph(f"<b>{int(tot_t_qty)}</b>" if tot_t_qty % 1 == 0 else f"<b>{format_indian_currency(tot_t_qty)}</b>", cell_style_right_bold),
        Paragraph(f"<b>{int(tot_p_qty)}</b>" if tot_p_qty % 1 == 0 else f"<b>{format_indian_currency(tot_p_qty)}</b>", cell_style_right_bold),
        Paragraph(f"<b>{int(tot_s_qty)}</b>" if tot_s_qty % 1 == 0 else f"<b>{format_indian_currency(tot_s_qty)}</b>", cell_style_right_bold),
        Paragraph(f"<b>{int(tot_qty)}</b>" if tot_qty % 1 == 0 else f"<b>{format_indian_currency(tot_qty)}</b>", cell_style_right_bold),
        Paragraph("", cell_style_right),
        Paragraph(f"<b>{format_indian_currency(invoice.gross_amount)}</b>", cell_style_right_bold),
    ])
    totals_row_idx = blank_row_idx + 1
    
    row_heights = [None] * (1 + num_items) + [h_blank] + [None]
    prod_table = Table(prod_rows, colWidths=prod_widths, rowHeights=row_heights, repeatRows=1)
    
    prod_table_style = [
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 2),
        ('INNERGRID', (0,0), (-1, num_items), 0.5, colors.black),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.black),
        ('SPAN', (0, totals_row_idx), (1, totals_row_idx)),
    ]
    
    # Draw vertical dividers for blank writing area
    prod_table_style.append(
        ('LINEBEFORE', (1, blank_row_idx), (-1, blank_row_idx), 0.5, colors.black)
    )
    
    # Draw a line above totals row (separating blank writing area from totals row)
    prod_table_style.append(
        ('LINEABOVE', (0, totals_row_idx), (-1, totals_row_idx), 1, colors.black)
    )
    # Draw vertical divider lines inside totals row
    prod_table_style.append(
        ('LINEBEFORE', (1, totals_row_idx), (-1, totals_row_idx), 0.5, colors.black)
    )
    
    prod_table.setStyle(TableStyle(prod_table_style))
    
    # --- 6. COMPILE SECTIONS INTO MASTER TABLE WITH CONTINUOUS BORDER ---
    master_data = [
        [header_table],
        [detail_table],
        [prod_table],
        [bottom_master_table],
        [words_table]
    ]
    
    master_table = Table(master_data, colWidths=[523])
    master_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1.5, colors.black),       # Single heavy outer border enclosing all blocks
        ('INNERGRID', (0,0), (-1,-1), 1, colors.black),   # Clean horizontal split lines between each section
        ('LEFTPADDING', (0,0), (-1,-1), 0),               # Clear default horizontal padding
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),                # Clear default vertical padding
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    
    flowables.append(master_table)
    flowables.append(Spacer(1, h_spacer))
    flowables.append(sign_table)
    return flowables


def generate_invoice_pdf(invoice, company):
    buffer = io.BytesIO()
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'InvoiceTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, alignment=TA_CENTER, leading=12
    )
    company_name_style = ParagraphStyle(
        'CompanyName', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=20, alignment=TA_CENTER, textColor=colors.black, leading=24
    )
    company_details_style = ParagraphStyle(
        'CompanyDetails', parent=styles['Normal'], fontName='Helvetica', fontSize=8, alignment=TA_CENTER, leading=10
    )
    cell_style_left = ParagraphStyle(
        'CellLeft', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=10
    )
    cell_style_left_bold = ParagraphStyle(
        'CellLeftBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10
    )
    cell_style_right = ParagraphStyle(
        'CellRight', parent=styles['Normal'], fontName='Helvetica', fontSize=8, alignment=TA_RIGHT, leading=10
    )
    cell_style_right_bold = ParagraphStyle(
        'CellRightBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, alignment=TA_RIGHT, leading=10
    )
    cell_style_center = ParagraphStyle(
        'CellCenter', parent=styles['Normal'], fontName='Helvetica', fontSize=8, alignment=TA_CENTER, leading=10
    )
    cell_style_center_bold = ParagraphStyle(
        'CellCenterBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, alignment=TA_CENTER, leading=10
    )
    
    story = _get_invoice_flowables(
        invoice, company, styles,
        title_style, company_name_style, company_details_style,
        cell_style_left, cell_style_left_bold, cell_style_right, cell_style_right_bold,
        cell_style_center, cell_style_center_bold
    )
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_bulk_invoice_pdf(invoices, company):
    buffer = io.BytesIO()
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'InvoiceTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, alignment=TA_CENTER, leading=12
    )
    company_name_style = ParagraphStyle(
        'CompanyName', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=20, alignment=TA_CENTER, textColor=colors.black, leading=24
    )
    company_details_style = ParagraphStyle(
        'CompanyDetails', parent=styles['Normal'], fontName='Helvetica', fontSize=8, alignment=TA_CENTER, leading=10
    )
    cell_style_left = ParagraphStyle(
        'CellLeft', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=10
    )
    cell_style_left_bold = ParagraphStyle(
        'CellLeftBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10
    )
    cell_style_right = ParagraphStyle(
        'CellRight', parent=styles['Normal'], fontName='Helvetica', fontSize=8, alignment=TA_RIGHT, leading=10
    )
    cell_style_right_bold = ParagraphStyle(
        'CellRightBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, alignment=TA_RIGHT, leading=10
    )
    cell_style_center = ParagraphStyle(
        'CellCenter', parent=styles['Normal'], fontName='Helvetica', fontSize=8, alignment=TA_CENTER, leading=10
    )
    cell_style_center_bold = ParagraphStyle(
        'CellCenterBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, alignment=TA_CENTER, leading=10
    )
    
    story = []
    for idx, invoice in enumerate(invoices):
        flowables = _get_invoice_flowables(
            invoice, company, styles,
            title_style, company_name_style, company_details_style,
            cell_style_left, cell_style_left_bold, cell_style_right, cell_style_right_bold,
            cell_style_center, cell_style_center_bold
        )
        story.extend(flowables)
        if idx < len(invoices) - 1:
            story.append(PageBreak())
            
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
