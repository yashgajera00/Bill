import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import invoiceAPI from '../services/invoiceAPI';

const formatAmount = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '0.00';
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

export default function InvoiceHistory({ triggerAlert }) {
  const [invoices, setInvoices] = useState([]);
  const [filters, setFilters] = useState({
    q_bill: '',
    q_cust: '',
    date_from: '',
    date_to: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    q_bill: '',
    q_cust: '',
    date_from: '',
    date_to: ''
  });
  const [loading, setLoading] = useState(true);
  
  // State for confirm delete view
  const [deleteInvoice, setDeleteInvoice] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewInvoiceId, setPreviewInvoiceId] = useState(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);

  const navigate = useNavigate();

  const fetchInvoices = async (params = {}) => {
    setLoading(true);
    try {
      const data = await invoiceAPI.list(params);
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      triggerAlert('Failed to load invoice history.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(activeFilters);
  }, [activeFilters]);

  useEffect(() => {
    setSelectedInvoiceIds([]);
  }, [invoices]);

  const handleSelectInvoice = (id) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedInvoiceIds.length === invoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(invoices.map(inv => inv.id));
    }
  };

  const handleDownloadSelectedPdf = async () => {
    if (selectedInvoiceIds.length === 0) return;
    try {
      triggerAlert(`Generating combined PDF for ${selectedInvoiceIds.length} invoices...`, 'info');
      const blob = await invoiceAPI.getBulkPdfBlob(selectedInvoiceIds);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Invoices_Bulk.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      triggerAlert('Bulk PDF downloaded successfully.', 'success');
    } catch (err) {
      console.error('Failed to download bulk PDF:', err);
      triggerAlert('Error downloading bulk PDF file.', 'danger');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setActiveFilters({ ...filters });
  };

  const handleClearFilters = () => {
    const cleared = {
      q_bill: '',
      q_cust: '',
      date_from: '',
      date_to: ''
    };
    setFilters(cleared);
    setActiveFilters(cleared);
  };

  const handleDeleteSubmit = async () => {
    if (!deleteInvoice) return;
    setDeleting(true);
    try {
      await invoiceAPI.delete(deleteInvoice.id);
      triggerAlert(`Invoice ${deleteInvoice.bill_number || '-'} deleted successfully.`, 'success');
      setDeleteInvoice(null);
      fetchInvoices(activeFilters);
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      triggerAlert(err.response?.data?.error || 'Failed to delete invoice.', 'danger');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPdf = async (invoiceId, billNumber) => {
    try {
      const blob = await invoiceAPI.getPdfBlob(invoiceId);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const filename = `Invoice_${billNumber.replace(/\//g, '_')}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download PDF:', err);
      triggerAlert('Error downloading PDF file.', 'danger');
    }
  };

  const handleDuplicate = (invoiceId) => {
    navigate(`/create-invoice?duplicate_id=${invoiceId}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const hasActiveFilters = activeFilters.q_bill || activeFilters.q_cust || activeFilters.date_from || activeFilters.date_to;



  return (
    <div className="container-fluid p-0">
      <div className="content-card">
        <div className="card-title mb-4">
          <span><i className="bi bi-file-earmark-text me-2 text-primary"></i> Invoice History</span>
          <div className="d-flex gap-2">
            {selectedInvoiceIds.length > 0 && (
              <button 
                type="button" 
                onClick={handleDownloadSelectedPdf} 
                className="btn btn-success d-flex align-items-center gap-1"
              >
                <i className="bi bi-download"></i> Download Selected ({selectedInvoiceIds.length})
              </button>
            )}
            <Link to="/create-invoice" className="btn btn-primary">
              <i className="bi bi-plus-circle me-1"></i> Create Invoice
            </Link>
          </div>
        </div>

        {/* Filter Form */}
        <form onSubmit={handleFilterSubmit} className="row g-3 mb-4 p-3 bg-light rounded-3">
          <div className="col-md-3 col-12">
            <label className="form-label small text-muted font-monospace">Bill Number</label>
            <input 
              type="text" 
              name="q_bill" 
              className="form-control" 
              placeholder="Search bill no..." 
              value={filters.q_bill}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-3 col-12">
            <label className="form-label small text-muted font-monospace">Customer Name</label>
            <input 
              type="text" 
              name="q_cust" 
              className="form-control" 
              placeholder="Search customer..." 
              value={filters.q_cust}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-2 col-6">
            <label className="form-label small text-muted font-monospace">Date From</label>
            <input 
              type="date" 
              name="date_from" 
              className="form-control" 
              value={filters.date_from}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-2 col-6">
            <label className="form-label small text-muted font-monospace">Date To</label>
            <input 
              type="date" 
              name="date_to" 
              className="form-control" 
              value={filters.date_to}
              onChange={handleFilterChange}
            />
          </div>
          <div className="col-md-2 col-12 d-flex align-items-end gap-2">
            <button type="submit" className="btn btn-outline-secondary w-100"><i className="bi bi-funnel"></i> Filter</button>
            {hasActiveFilters && (
              <button type="button" onClick={handleClearFilters} className="btn btn-outline-danger"><i className="bi bi-x"></i> Clear</button>
            )}
          </div>
        </form>

        {/* Invoices List Table */}
        <div className="table-responsive">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>
                    <input 
                      type="checkbox" 
                      className="form-check-input"
                      checked={invoices.length > 0 && selectedInvoiceIds.length === invoices.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Bill No</th>
                  <th>Customer</th>
                  <th>Bill Date</th>
                  <th>Cha. No</th>
                  <th>HSN Code</th>
                  <th>Grand Total</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? (
                  invoices.map(inv => (
                    <tr key={inv.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="form-check-input m-0"
                            checked={selectedInvoiceIds.includes(inv.id)}
                            onChange={() => handleSelectInvoice(inv.id)}
                          />
                          {selectedInvoiceIds.includes(inv.id) && (
                            <span className="badge bg-success rounded-circle d-flex align-items-center justify-content-center font-monospace" style={{ width: '18px', height: '18px', fontSize: '10px', padding: 0 }}>
                              {selectedInvoiceIds.indexOf(inv.id) + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td><strong>{inv.bill_number}</strong></td>
                      <td>{inv.customer_name || inv.customer?.name}</td>
                      <td>{formatDate(inv.bill_date)}</td>
                      <td>{inv.challan_no || '-'}</td>
                      <td>{inv.hsn_code || '-'}</td>
                      <td><strong>₹{formatAmount(inv.grand_total)}</strong></td>
                      <td className="text-center">
                        <div className="btn-group">
                          <button 
                            type="button" 
                            onClick={() => setPreviewInvoiceId(inv.id)} 
                            className="btn btn-sm btn-outline-secondary" 
                            title="Preview Invoice"
                          >
                            <i className="bi bi-eye"></i> Preview
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDownloadPdf(inv.id, inv.bill_number)} 
                            className="btn btn-sm btn-outline-primary" 
                            title="Download PDF"
                          >
                            <i className="bi bi-file-pdf"></i> PDF
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleDuplicate(inv.id)} 
                            className="btn btn-sm btn-outline-info" 
                            title="Duplicate"
                          >
                            <i className="bi bi-file-earmark-plus"></i> Copy
                          </button>
                          <Link to={`/invoices/edit/${inv.id}`} className="btn btn-sm btn-outline-warning" title="Edit">
                            <i className="bi bi-pencil"></i> Edit
                          </Link>
                          <button 
                            type="button" 
                            onClick={() => setDeleteInvoice(inv)} 
                            className="btn btn-sm btn-outline-danger" 
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">No invoices found matching search filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal overlay popup for Confirm Delete Invoice */}
      {deleteInvoice && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title text-danger fw-bold d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i> Confirm Delete Invoice
                </h5>
                <button type="button" className="btn-close" onClick={() => setDeleteInvoice(null)} aria-label="Close"></button>
              </div>
              <div className="modal-body py-3">
                <p className="mb-0">
                  Are you sure you want to delete invoice number <strong>"{deleteInvoice.bill_number || '-'}"</strong>? This action cannot be undone. All database records associated with this billing transaction will be permanently removed.
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button 
                  type="button" 
                  onClick={() => setDeleteInvoice(null)} 
                  className="btn btn-light border btn-sm px-3"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteSubmit} 
                  className="btn btn-danger btn-sm px-3"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Invoice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal overlay popup for Live PDF Invoice Preview */}
      {previewInvoiceId && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '90%', height: '90vh' }}>
            <div className="modal-content h-100 border-0 shadow-lg d-flex flex-column">
              <div className="modal-header bg-dark text-white border-0 py-2">
                <h5 className="modal-title fw-bold d-flex align-items-center small text-uppercase font-monospace">
                  <i className="bi bi-file-earmark-pdf-fill me-2 text-danger"></i> Invoice PDF Live Preview
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setPreviewInvoiceId(null)} 
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-0 bg-secondary flex-grow-1">
                <iframe 
                  src={`/api/invoices/pdf/${previewInvoiceId}/`} 
                  title="Invoice PDF" 
                  width="100%" 
                  height="100%" 
                  className="border-0"
                ></iframe>
              </div>
              <div className="modal-footer border-0 py-2">
                <button 
                  type="button" 
                  onClick={() => setPreviewInvoiceId(null)} 
                  className="btn btn-secondary btn-sm px-4"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
