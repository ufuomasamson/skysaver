import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function downloadTicket(ticketRef?: React.RefObject<HTMLDivElement | null>) {
  const ticket = ticketRef?.current || document.getElementById('ticket');
  console.log('downloadTicket: ticketRef', ticketRef);
  console.log('downloadTicket: ticket element', ticket);
  if (!ticket) {
    alert('Ticket element not found!');
    return;
  }
  // Print the outer HTML for debugging
  console.log('downloadTicket: ticket outerHTML', ticket.outerHTML);
  try {
    // Use html2canvas to render the ticket element
    const canvas = await html2canvas(ticket, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    // Calculate width/height to fit A4
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('flight-ticket.pdf');
  } catch (err) {
    console.error('PDF download error:', err);
  }
} 