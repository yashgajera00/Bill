import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import customersAPI from '../services/customersAPI';
import invoiceAPI from '../services/invoiceAPI';
import { convertNumberToWords } from '../utils/numberToWords';

const formatAmount = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '0.00';
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

export default function CreateInvoice({ triggerAlert, mode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // Search parameters for duplication check
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const duplicateId = queryParams.get('duplicate_id');

  // Load state
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [previewInvoiceId, setPreviewInvoiceId] = useState(null);

  // Form fields state
  const [invoiceForm, setInvoiceForm] = useState({
    customer: '',
    bill_number: '',
    bill_date: new Date().toISOString().substr(0, 10), // Default to current date YYYY-MM-DD
    challan_no: '',
    hsn_code: '',
    broker: '',
    discount_percent: '0.00',
    blouse_charge: '0.00',
    sgst_percent: '2.50',
    cgst_percent: '2.50'
  });

  // Customer fields state
  const [customerForm, setCustomerForm] = useState({
    name: '',
    address: '',
    gst_number: ''
  });

  // Filtered customers list for autocomplete search dropdown
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes((customerForm.name || '').toLowerCase())
    );
  }, [customers, customerForm.name]);

  // Table items state
  const [items, setItems] = useState([
    { p_ch_no: '', lot_no: '', design: '', meter: '', t_qty: '', p_qty: '', s_qty: '', qty: '', rate: '' }
  ]);

  // Ref and Effect for auto-expanding Billing Address textarea
  const addressRef = useRef(null);
  useEffect(() => {
    if (addressRef.current) {
      addressRef.current.style.height = 'auto';
      addressRef.current.style.height = `${addressRef.current.scrollHeight}px`;
    }
  }, [customerForm.address]);

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // Load customers dropdown options
        const customersList = await customersAPI.list();
        setCustomers(customersList);

        if (mode === 'Edit' && id) {
          // Edit Mode
          const invoiceData = await invoiceAPI.get(id);
          setInvoiceForm({
            customer: invoiceData.customer?.id || '',
            bill_number: invoiceData.bill_number || '',
            bill_date: invoiceData.bill_date || '',
            challan_no: invoiceData.challan_no || '',
            hsn_code: invoiceData.hsn_code || '',
            broker: invoiceData.broker || '',
            discount_percent: parseFloat(invoiceData.discount_percent).toFixed(2),
            blouse_charge: parseFloat(invoiceData.blouse_charge).toFixed(2),
            sgst_percent: parseFloat(invoiceData.sgst_percent).toFixed(2),
            cgst_percent: parseFloat(invoiceData.cgst_percent).toFixed(2)
          });
          setCustomerForm({
            name: invoiceData.customer?.name || '',
            address: invoiceData.customer?.address || '',
            gst_number: invoiceData.customer?.gst_number || ''
          });
          if (invoiceData.items && invoiceData.items.length > 0) {
            setItems(invoiceData.items.map(item => ({
              p_ch_no: item.p_ch_no || '',
              lot_no: item.lot_no || '',
              design: item.design || '',
              meter: parseFloat(item.meter) === 0 ? '' : parseFloat(item.meter).toFixed(2),
              t_qty: parseFloat(item.t_qty) === 0 ? '' : String(parseInt(item.t_qty)),
              p_qty: parseFloat(item.p_qty) === 0 ? '' : parseFloat(item.p_qty).toFixed(2),
              s_qty: parseFloat(item.s_qty) === 0 ? '' : parseFloat(item.s_qty).toFixed(2),
              qty: parseFloat(item.qty) === 0 ? '' : parseFloat(item.qty).toFixed(2),
              rate: parseFloat(item.rate) === 0 ? '' : parseFloat(item.rate).toFixed(2)
            })));
          }
        } else if (mode === 'Add' && duplicateId) {
          // Duplication mode (Add from Duplicate ID)
          const invoiceData = await invoiceAPI.get(duplicateId);
          setInvoiceForm({
            customer: invoiceData.customer?.id || '',
            bill_number: '', // Must be filled manually
            bill_date: new Date().toISOString().substr(0, 10), // Defaults to today's date
            challan_no: invoiceData.challan_no || '',
            hsn_code: invoiceData.hsn_code || '',
            broker: invoiceData.broker || '',
            discount_percent: parseFloat(invoiceData.discount_percent).toFixed(2),
            blouse_charge: parseFloat(invoiceData.blouse_charge).toFixed(2),
            sgst_percent: parseFloat(invoiceData.sgst_percent).toFixed(2),
            cgst_percent: parseFloat(invoiceData.cgst_percent).toFixed(2)
          });
          setCustomerForm({
            name: invoiceData.customer?.name || '',
            address: invoiceData.customer?.address || '',
            gst_number: invoiceData.customer?.gst_number || ''
          });
          if (invoiceData.items && invoiceData.items.length > 0) {
            setItems(invoiceData.items.map(item => ({
              p_ch_no: item.p_ch_no || '',
              lot_no: item.lot_no || '',
              design: item.design || '',
              meter: parseFloat(item.meter) === 0 ? '' : parseFloat(item.meter).toFixed(2),
              t_qty: parseFloat(item.t_qty) === 0 ? '' : String(parseInt(item.t_qty)),
              p_qty: parseFloat(item.p_qty) === 0 ? '' : parseFloat(item.p_qty).toFixed(2),
              s_qty: parseFloat(item.s_qty) === 0 ? '' : parseFloat(item.s_qty).toFixed(2),
              qty: parseFloat(item.qty) === 0 ? '' : parseFloat(item.qty).toFixed(2),
              rate: parseFloat(item.rate) === 0 ? '' : parseFloat(item.rate).toFixed(2)
            })));
          }
        }
      } catch (err) {
        console.error('Failed to initialize invoice form:', err);
        triggerAlert('Error loading data.', 'danger');
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [mode, id, duplicateId]);

  // Form field updates
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setInvoiceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle click outside dropdown to close it
  useEffect(() => {
    if (!dropdownOpen) return;
    const closeDropdown = (e) => {
      if (!e.target.closest('.customer-dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [dropdownOpen]);

  const handleCustomerSelectionChange = (custId) => {
    setInvoiceForm(prev => ({
      ...prev,
      customer: custId
    }));
    setIsEditingCustomer(false);
    
    if (custId) {
      const selected = customers.find(c => String(c.id) === String(custId));
      if (selected) {
        setCustomerForm({
          name: selected.name || '',
          address: selected.address || '',
          gst_number: selected.gst_number || ''
        });
      }
    } else {
      setCustomerForm({
        name: '',
        address: '',
        gst_number: ''
      });
    }
  };

  const handleCustomerFormChange = (e) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCustomer = async () => {
    if (!customerForm.name || !customerForm.address) {
      triggerAlert('Please enter Name and Address for the customer.', 'danger');
      return;
    }
    setSavingCustomer(true);
    try {
      const newCust = await customersAPI.add(customerForm);
      // Update dropdown list
      setCustomers(prev => [...prev, newCust].sort((a, b) => a.name.localeCompare(b.name)));
      // Select the new customer
      setInvoiceForm(prev => ({
        ...prev,
        customer: newCust.id
      }));
      // Display success alert
      triggerAlert('Customer added successfully.', 'success');
    } catch (err) {
      console.error('Failed to save customer:', err);
      let errMsg = 'Failed to save customer.';
      if (err.response?.data) {
        if (err.response.data.details) {
          const details = err.response.data.details;
          const messages = Object.keys(details).map(key => `${key.replace('_', ' ')}: ${details[key].join(', ')}`);
          errMsg = messages.join(' | ');
        } else if (err.response.data.error) {
          errMsg = err.response.data.error;
        }
      }
      triggerAlert(errMsg, 'danger');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleStartEditCustomer = (c) => {
    setInvoiceForm(prev => ({
      ...prev,
      customer: c.id
    }));
    setCustomerForm({
      name: c.name || '',
      address: c.address || '',
      gst_number: c.gst_number || ''
    });
    setIsEditingCustomer(true);
  };

  const handleCancelEditCustomer = () => {
    setIsEditingCustomer(false);
    const selected = customers.find(c => String(c.id) === String(invoiceForm.customer));
    if (selected) {
      setCustomerForm({
        name: selected.name || '',
        address: selected.address || '',
        gst_number: selected.gst_number || ''
      });
    }
  };

  const handleUpdateCustomer = async () => {
    if (!customerForm.name || !customerForm.address) {
      triggerAlert('Please enter Name and Address for the customer.', 'danger');
      return;
    }
    setSavingCustomer(true);
    try {
      const updatedCust = await customersAPI.edit(invoiceForm.customer, customerForm);
      setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c).sort((a, b) => a.name.localeCompare(b.name)));
      triggerAlert('Customer updated successfully.', 'success');
      setIsEditingCustomer(false);
    } catch (err) {
      console.error('Failed to update customer:', err);
      let errMsg = 'Failed to update customer.';
      if (err.response?.data) {
        if (err.response.data.details) {
          const details = err.response.data.details;
          const messages = Object.keys(details).map(key => `${key.replace('_', ' ')}: ${details[key].join(', ')}`);
          errMsg = messages.join(' | ');
        } else if (err.response.data.error) {
          errMsg = err.response.data.error;
        }
      }
      triggerAlert(errMsg, 'danger');
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleDeleteCustomer = async (custId) => {
    if (!window.confirm('Are you sure you want to delete this customer? This will not delete past invoices but will remove the customer from the list.')) {
      return;
    }
    try {
      await customersAPI.delete(custId);
      setCustomers(prev => prev.filter(c => c.id !== custId));
      if (String(invoiceForm.customer) === String(custId)) {
        setInvoiceForm(prev => ({
          ...prev,
          customer: ''
        }));
        setCustomerForm({
          name: '',
          address: '',
          gst_number: ''
        });
        setIsEditingCustomer(false);
      }
      triggerAlert('Customer deleted successfully.', 'success');
    } catch (err) {
      console.error('Failed to delete customer:', err);
      triggerAlert(err.response?.data?.error || 'Failed to delete customer.', 'danger');
    }
  };

  // Item field changes in grid
  const handleItemChange = (index, field, value) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return newItems;
    });
  };

  // Add dynamic row
  const addRow = () => {
    setItems(prev => [
      ...prev,
      { p_ch_no: '', lot_no: '', design: '', meter: '', t_qty: '', p_qty: '', s_qty: '', qty: '', rate: '' }
    ]);
  };

  // Delete dynamic row
  const deleteRow = (index) => {
    if (items.length === 1) {
      // Clear out the only row instead of deleting
      setItems([{ p_ch_no: '', lot_no: '', design: '', meter: '', t_qty: '', p_qty: '', s_qty: '', qty: '', rate: '' }]);
    } else {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Clear numeric value if it is 0 on focus so the user doesn't have to backspace
  const handleNumericFocus = (index, field) => {
    const val = items[index][field];
    if (parseFloat(val) === 0 || val === '0' || val === '0.00') {
      handleItemChange(index, field, '');
    }
  };

  // Format numeric value on blur
  const handleNumericBlur = (index, field) => {
    const val = items[index][field];
    if (val !== '' && !isNaN(val)) {
      const num = parseFloat(val);
      if (num === 0) {
        handleItemChange(index, field, '');
      } else {
        if (field === 't_qty') {
          handleItemChange(index, field, String(Math.round(num)));
        } else {
          handleItemChange(index, field, num.toFixed(2));
        }
      }
    }
  };

  // Reset form fields to their empty/default values
  const executeClearForm = () => {
    setInvoiceForm({
      customer: '',
      bill_number: '',
      bill_date: new Date().toISOString().substr(0, 10),
      challan_no: '',
      hsn_code: '',
      broker: '',
      discount_percent: '0.00',
      blouse_charge: '0.00',
      sgst_percent: '2.50',
      cgst_percent: '2.50'
    });
    setCustomerForm({
      name: '',
      address: '',
      gst_number: ''
    });
    setItems([
      { p_ch_no: '', lot_no: '', design: '', meter: '', t_qty: '', p_qty: '', s_qty: '', qty: '', rate: '' }
    ]);
    setIsEditingCustomer(false);
  };

  const handleClearForm = () => {
    setShowClearConfirmModal(true);
  };

  // Dynamic calculations via useMemo for live updates
  const calculations = useMemo(() => {
    let gross_amount = 0;
    let total_meter = 0;
    let total_tqty = 0;
    let total_pqty = 0;
    let total_sqty = 0;
    let total_qty = 0;

    // Calculate row amounts and sums
    const calculatedItems = items.map(item => {
      const meter = parseFloat(item.meter) || 0;
      const t_qty = parseFloat(item.t_qty) || 0;
      const p_qty = parseFloat(item.p_qty) || 0;
      const s_qty = parseFloat(item.s_qty) || 0;
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = qty * rate;

      gross_amount += amount;
      total_meter += meter;
      total_tqty += t_qty;
      total_pqty += p_qty;
      total_sqty += s_qty;
      total_qty += qty;

      return {
        ...item,
        amount: amount.toFixed(2)
      };
    });

    const discountPercent = parseFloat(invoiceForm.discount_percent) || 0;
    const discount_amount = (gross_amount * discountPercent) / 100;
    const blouseCharge = parseFloat(invoiceForm.blouse_charge) || 0;
    const subtotal = gross_amount - discount_amount + blouseCharge;

    const sgstPercent = parseFloat(invoiceForm.sgst_percent) || 0;
    const sgst_amount = (subtotal * sgstPercent) / 100;
    const cgstPercent = parseFloat(invoiceForm.cgst_percent) || 0;
    const cgst_amount = (subtotal * cgstPercent) / 100;

    const exactTotal = subtotal + sgst_amount + cgst_amount;
    const grand_total = Math.round(exactTotal);
    const round_off = grand_total - exactTotal;
    const amount_in_words = convertNumberToWords(grand_total);

    return {
      items: calculatedItems,
      totals: {
        total_meter: total_meter.toFixed(2),
        total_tqty: total_tqty,
        total_pqty: total_pqty.toFixed(2),
        total_sqty: total_sqty.toFixed(2),
        total_qty: total_qty.toFixed(2)
      },
      summary: {
        gross_amount: gross_amount.toFixed(2),
        discount_amount: discount_amount.toFixed(2),
        subtotal: subtotal.toFixed(2),
        sgst_amount: sgst_amount.toFixed(2),
        cgst_amount: cgst_amount.toFixed(2),
        round_off: round_off.toFixed(2),
        grand_total: grand_total.toFixed(2),
        amount_in_words
      }
    };
  }, [items, invoiceForm.discount_percent, invoiceForm.blouse_charge, invoiceForm.sgst_percent, invoiceForm.cgst_percent]);

  const handleClosePreview = () => {
    setPreviewInvoiceId(null);
    navigate('/invoice-history');
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate customer selection or ad-hoc details
    if (!invoiceForm.customer) {
      if (!customerForm.name || !customerForm.address) {
        triggerAlert('Please select an existing customer or enter the Customer Name and Address manually.', 'danger');
        return;
      }
    }

    // Filter valid rows
    const validItems = calculations.items
      .map(item => ({
        p_ch_no: (item.p_ch_no || '').trim(),
        lot_no: (item.lot_no || '').trim(),
        design: (item.design || '').trim(),
        meter: parseFloat(item.meter) || 0,
        t_qty: parseFloat(item.t_qty) || 0,
        p_qty: parseFloat(item.p_qty) || 0,
        s_qty: parseFloat(item.s_qty) || 0,
        qty: parseFloat(item.qty) || 0,
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0
      }))
      .filter(item => {
        // Skip entirely blank rows
        return (
          item.p_ch_no !== "" ||
          item.lot_no !== "" ||
          item.design !== "" ||
          item.meter !== 0 ||
          item.qty !== 0 ||
          item.rate !== 0
        );
      });

    if (validItems.length === 0) {
      triggerAlert('Please add at least one product row with valid quantities and rates.', 'danger');
      return;
    }

    // Combine form and calculations payload
    const payload = {
      ...invoiceForm,
      customer: invoiceForm.customer || null,
      customer_name: customerForm.name || '',
      customer_address: customerForm.address || '',
      customer_gst_number: customerForm.gst_number || '',
      gross_amount: parseFloat(calculations.summary.gross_amount),
      discount_amount: parseFloat(calculations.summary.discount_amount),
      subtotal: parseFloat(calculations.summary.subtotal),
      sgst_amount: parseFloat(calculations.summary.sgst_amount),
      cgst_amount: parseFloat(calculations.summary.cgst_amount),
      round_off: parseFloat(calculations.summary.round_off),
      grand_total: parseFloat(calculations.summary.grand_total),
      amount_in_words: calculations.summary.amount_in_words,
      items: validItems
    };

    setSaving(true);
    try {
      let response;
      if (mode === 'Edit' && id) {
        response = await invoiceAPI.edit(id, payload);
        triggerAlert(`Invoice ${response.bill_number} updated successfully.`, 'success');
      } else {
        response = await invoiceAPI.add(payload);
        triggerAlert(`Invoice ${response.bill_number} created successfully.`, 'success');
      }
      setPreviewInvoiceId(response.id);
    } catch (err) {
      console.error('Failed to save invoice:', err);
      const details = err.response?.data?.details;
      if (details && details.bill_number) {
        setShowDuplicateModal(true);
      } else {
        triggerAlert(err.response?.data?.error || 'Error saving invoice details.', 'danger');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-0">
        <div className="content-card text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-xxl p-0">
      <div className="content-card pb-2">
        <form onSubmit={handleSubmit} id="invoice-form">
          <div className="card p-3 border bg-light-subtle mb-4">
            <div className="row g-3">
              {/* Row 1 */}
              {/* Customer Name / Suggestion Dropdown */}
              <div className="col-lg-4 col-md-6 col-12 customer-dropdown-container position-relative">
                <label className="form-label font-monospace small text-uppercase fw-bold text-muted">Customer Name</label>
                <div className="input-group">
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Enter Customer Name"
                    value={customerForm.name}
                    onChange={(e) => {
                      handleCustomerFormChange(e);
                      setDropdownOpen(true);
                    }}
                    onFocus={() => setDropdownOpen(true)}
                    required={!invoiceForm.customer}
                    disabled={saving || (!!invoiceForm.customer && !isEditingCustomer)}
                    autoComplete="off"
                  />
                  {invoiceForm.customer && (
                    <button 
                      type="button" 
                      className="btn btn-outline-danger"
                      onClick={() => {
                        handleCustomerSelectionChange("");
                      }}
                      title="Deselect Customer"
                      disabled={saving}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>

                {dropdownOpen && (
                  <ul 
                    className="dropdown-menu show w-100 shadow-lg border border-light-subtle py-1" 
                    style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: 0, 
                      zIndex: 1050, 
                      display: 'block', 
                      maxHeight: '250px', 
                      overflowY: 'auto' 
                    }}
                  >
                    {filteredCustomers.length === 0 ? (
                      <li className="px-3 py-2 text-muted small">No matching customers found</li>
                    ) : (
                      filteredCustomers.map(c => (
                        <li 
                          key={c.id} 
                          className="d-flex align-items-center justify-content-between px-3 py-1 border-bottom border-light-subtle text-secondary"
                          style={{ cursor: 'pointer', transition: 'background-color 0.15s ease-in-out' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span 
                            className="text-truncate flex-grow-1 py-1 fw-medium" 
                            onClick={() => {
                              handleCustomerSelectionChange(c.id);
                              setDropdownOpen(false);
                            }}
                          >
                            {c.name}
                          </span>
                          <div className="d-flex gap-1">
                            <button 
                              className="btn btn-sm btn-outline-primary border-0 p-1" 
                              type="button" 
                              title="Edit Customer Details"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditCustomer(c);
                                setDropdownOpen(false);
                              }}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger border-0 p-1" 
                              type="button" 
                              title="Delete Customer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCustomer(c.id);
                                setDropdownOpen(false);
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              {/* GST Number */}
              <div className="col-lg-4 col-md-6 col-12">
                <label className="form-label font-monospace small text-uppercase fw-bold text-muted">GST Number</label>
                <div className="input-group">
                  <input
                    type="text"
                    name="gst_number"
                    className="form-control"
                    placeholder="Enter GSTIN"
                    value={customerForm.gst_number}
                    onChange={handleCustomerFormChange}
                    disabled={saving || (!!invoiceForm.customer && !isEditingCustomer)}
                  />
                  {invoiceForm.customer ? (
                    isEditingCustomer ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-success text-white px-2 btn-sm text-truncate"
                          onClick={handleUpdateCustomer}
                          disabled={saving || savingCustomer}
                          title="Update Customer"
                          style={{ maxWidth: '80px' }}
                        >
                          {savingCustomer ? '...' : 'Update'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary text-white px-2 btn-sm text-truncate"
                          onClick={handleCancelEditCustomer}
                          disabled={saving || savingCustomer}
                          title="Cancel"
                          style={{ maxWidth: '80px' }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm text-truncate"
                        onClick={() => setIsEditingCustomer(true)}
                        disabled={saving}
                        title="Edit Customer"
                        style={{ maxWidth: '120px' }}
                      >
                        <i className="bi bi-pencil-square me-1"></i> Edit
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm text-truncate"
                      onClick={handleSaveCustomer}
                      disabled={saving || savingCustomer}
                      title="Save Customer"
                      style={{ maxWidth: '120px' }}
                    >
                      {savingCustomer ? (
                        <>...</>
                      ) : (
                        <>
                          <i className="bi bi-person-plus-fill me-1"></i> Save
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Bill Number */}
              <div className="col-lg-2 col-md-6 col-6">
                <label className="form-label font-monospace small text-uppercase fw-bold text-muted">Bill Number</label>
                <input
                  type="text"
                  name="bill_number"
                  className="form-control"
                  value={invoiceForm.bill_number}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </div>

              {/* Bill Date */}
              <div className="col-lg-2 col-md-6 col-6">
                <label className="form-label font-monospace small text-uppercase fw-bold text-muted">Bill Date</label>
                <input
                  type="date"
                  name="bill_date"
                  className="form-control"
                  value={invoiceForm.bill_date}
                  onChange={handleFormChange}
                  required
                  disabled={saving}
                />
              </div>

              {/* Row 2 */}
              {/* Billing Address */}
              <div className="col-lg-6 col-md-12 col-12">
                <label className="form-label font-monospace small text-uppercase fw-bold text-muted">Billing Address</label>
                <textarea
                  ref={addressRef}
                  name="address"
                  rows="1"
                  className="form-control"
                  placeholder="Enter Billing Address"
                  value={customerForm.address}
                  onChange={handleCustomerFormChange}
                  required={!invoiceForm.customer}
                  disabled={saving || (!!invoiceForm.customer && !isEditingCustomer)}
                  style={{ resize: 'none', overflowY: 'hidden', minHeight: '38px' }}
                ></textarea>
              </div>

              {/* Cha. No */}
              <div className="col-lg-2 col-md-4 col-4">
                <label className="form-label font-monospace small text-uppercase fw-bold text-muted">Cha. No</label>
                <input
                  type="text"
                  name="challan_no"
                  className="form-control"
                  value={invoiceForm.challan_no}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </div>

              {/* HSN Code */}
              <div className="col-lg-2 col-md-4 col-4">
                <label className="form-label font-monospace small text-uppercase fw-bold text-muted">HSN Code</label>
                <input
                  type="text"
                  name="hsn_code"
                  className="form-control"
                  value={invoiceForm.hsn_code}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </div>

              {/* Broker */}
              <div className="col-lg-2 col-md-4 col-4">
                <label className="form-label font-monospace small text-uppercase fw-bold text-muted">Broker</label>
                <input
                  type="text"
                  name="broker"
                  className="form-control"
                  value={invoiceForm.broker}
                  onChange={handleFormChange}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="table-responsive mb-0 rounded-3 border overflow-hidden">
            <table className="table table-bordered table-sm align-middle invoice-table mb-0">
              <thead className="table-dark text-center small text-uppercase">
                <tr>
                  <th style={{ width: '40px' }}>No</th>
                  <th style={{ minWidth: '90px' }}>P.Ch.No</th>
                  <th style={{ minWidth: '90px' }}>Lot No</th>
                  <th style={{ minWidth: '150px' }}>Design</th>
                  <th style={{ minWidth: '80px' }}>Meter</th>
                  <th style={{ minWidth: '70px' }}>T.Qty</th>
                  <th style={{ minWidth: '70px' }}>P.Qty</th>
                  <th style={{ minWidth: '70px' }}>S.Qty</th>
                  <th style={{ minWidth: '80px' }}>Qty</th>
                  <th style={{ minWidth: '90px' }}>Rate</th>
                  <th style={{ minWidth: '120px' }}>Amount</th>
                  <th style={{ width: '50px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const calculatedAmount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
                  return (
                    <tr key={index}>
                      <td className="text-center align-middle row-number">{index + 1}</td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm item-pch"
                          value={item.p_ch_no}
                          onChange={(e) => handleItemChange(index, 'p_ch_no', e.target.value)}
                          disabled={saving}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm item-lot"
                          value={item.lot_no}
                          onChange={(e) => handleItemChange(index, 'lot_no', e.target.value)}
                          disabled={saving}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm item-design"
                          value={item.design}
                          onChange={(e) => handleItemChange(index, 'design', e.target.value)}
                          disabled={saving}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end item-meter"
                          value={item.meter}
                          onChange={(e) => handleItemChange(index, 'meter', e.target.value)}
                          onFocus={() => handleNumericFocus(index, 'meter')}
                          onBlur={() => handleNumericBlur(index, 'meter')}
                          placeholder="0"
                          disabled={saving}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="1"
                          className="form-control form-control-sm text-end item-tqty"
                          value={item.t_qty}
                          onChange={(e) => handleItemChange(index, 't_qty', e.target.value)}
                          onFocus={() => handleNumericFocus(index, 't_qty')}
                          onBlur={() => handleNumericBlur(index, 't_qty')}
                          placeholder="0"
                          disabled={saving}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end item-pqty"
                          value={item.p_qty}
                          onChange={(e) => handleItemChange(index, 'p_qty', e.target.value)}
                          onFocus={() => handleNumericFocus(index, 'p_qty')}
                          onBlur={() => handleNumericBlur(index, 'p_qty')}
                          placeholder="0"
                          disabled={saving}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end item-sqty"
                          value={item.s_qty}
                          onChange={(e) => handleItemChange(index, 's_qty', e.target.value)}
                          onFocus={() => handleNumericFocus(index, 's_qty')}
                          onBlur={() => handleNumericBlur(index, 's_qty')}
                          placeholder="0"
                          disabled={saving}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end item-qty"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                          onFocus={() => handleNumericFocus(index, 'qty')}
                          onBlur={() => handleNumericBlur(index, 'qty')}
                          placeholder="0"
                          disabled={saving}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control form-control-sm text-end item-rate"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          onFocus={() => handleNumericFocus(index, 'rate')}
                          onBlur={() => handleNumericBlur(index, 'rate')}
                          placeholder="0"
                          disabled={saving}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm text-end item-amount bg-light text-muted"
                          value={formatAmount(calculatedAmount)}
                          readOnly
                          disabled
                        />
                      </td>
                      <td className="text-center align-middle">
                        <button
                          type="button"
                          onClick={() => deleteRow(index)}
                          className="btn btn-sm btn-danger remove-row-btn"
                          disabled={saving}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {/* Row Type Add Button inside Table */}
                <tr>
                  <td colSpan="12" className="text-center p-2 bg-light-subtle">
                    <button
                      type="button"
                      onClick={addRow}
                      className="btn btn-outline-primary btn-sm rounded-pill mx-auto"
                      disabled={saving}
                      style={{ borderStyle: 'dashed', width: '85%' }}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Add Row
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot className="table-light fw-bold text-end">
                <tr>
                  <td colSpan="4" className="text-center">TOTALS</td>
                  <td id="total-meter">{calculations.totals.total_meter}</td>
                  <td id="total-tqty">{calculations.totals.total_tqty}</td>
                  <td id="total-pqty">{calculations.totals.total_pqty}</td>
                  <td id="total-sqty">{calculations.totals.total_sqty}</td>
                  <td id="total-qty">{calculations.totals.total_qty}</td>
                  <td></td>
                  <td id="total-amount">{formatAmount(calculations.summary.gross_amount)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="row g-2 mt-0">
            {/* Left side: Discount table */}
            <div className="col-lg-4 col-md-6 col-12 order-lg-1 order-md-1 order-1">
              <div className="card p-2 border-0 bg-light h-100">
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small font-monospace text-muted mb-0">Gross Amount (₹)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light text-muted text-end"
                      value={formatAmount(calculations.summary.gross_amount)}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small font-monospace text-muted mb-0">Discount %</label>
                    <input
                      type="number"
                      step="0.01"
                      name="discount_percent"
                      className="form-control form-control-sm"
                      value={invoiceForm.discount_percent}
                      onChange={handleFormChange}
                      disabled={saving}
                    />
                  </div>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small font-monospace text-muted mb-0">Discount Amount (₹)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light text-muted text-end"
                      value={formatAmount(calculations.summary.discount_amount)}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small font-monospace text-muted mb-0">Blouse Charge (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="blouse_charge"
                      className="form-control form-control-sm"
                      value={invoiceForm.blouse_charge}
                      onChange={handleFormChange}
                      disabled={saving}
                    />
                  </div>
                </div>
                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label small font-monospace text-muted mb-0">Sub Total (₹)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light text-muted text-end"
                      value={formatAmount(calculations.summary.subtotal)}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Middle part: Buttons & Amount in Words */}
            <div className="col-lg-4 col-md-12 col-12 order-lg-2 order-md-3 order-3 d-flex flex-column justify-content-between">
              <div className="card p-2 border-0 bg-light flex-grow-1 mb-2">
                <label className="form-label small font-monospace text-muted mb-0 fw-bold">Amount In Words</label>
                <textarea
                  className="form-control form-control-sm bg-light text-muted flex-grow-1 mt-1"
                  value={calculations.summary.amount_in_words}
                  readOnly
                  disabled
                  rows="2"
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Actions */}
              <div className="d-flex justify-content-center gap-2 mt-auto">
                <button 
                  type="button" 
                  onClick={handleClearForm} 
                  className="btn btn-light border btn-sm px-3"
                >
                  Clear
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm px-4"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-1"></i> Save Invoice
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right side: Totals table */}
            <div className="col-lg-4 col-md-6 col-12 order-lg-3 order-md-2 order-2">
              <div className="card p-2 border-0 bg-light h-100">
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small font-monospace text-muted mb-0">SGST %</label>
                    <input
                      type="number"
                      step="0.01"
                      name="sgst_percent"
                      className="form-control form-control-sm"
                      value={invoiceForm.sgst_percent}
                      onChange={handleFormChange}
                      disabled={saving}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small font-monospace text-muted mb-0">SGST Amount (₹)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light text-muted text-end"
                      value={formatAmount(calculations.summary.sgst_amount)}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small font-monospace text-muted mb-0">CGST %</label>
                    <input
                      type="number"
                      step="0.01"
                      name="cgst_percent"
                      className="form-control form-control-sm"
                      value={invoiceForm.cgst_percent}
                      onChange={handleFormChange}
                      disabled={saving}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small font-monospace text-muted mb-0">CGST Amount (₹)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light text-muted text-end"
                      value={formatAmount(calculations.summary.cgst_amount)}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small font-monospace text-muted mb-0">Round Off (₹)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light text-muted text-end"
                      value={formatAmount(calculations.summary.round_off)}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small font-monospace text-success mb-0 fw-bold">Grand Total (₹)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm bg-light text-success fw-bold text-end"
                      style={{ fontSize: '1.1rem', color: '#198754' }}
                      value={`₹ ${formatAmount(calculations.summary.grand_total)}`}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal overlay popup for Duplicate Bill Number */}
      {showDuplicateModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title text-warning fw-bold d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i> Duplicate Bill Number
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowDuplicateModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body py-3">
                <p className="mb-0">
                  The bill number <strong>"{invoiceForm.bill_number}"</strong> already exists in the system. Please enter a different, unique bill number to save this invoice.
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button 
                  type="button" 
                  onClick={() => setShowDuplicateModal(false)} 
                  className="btn btn-warning text-white btn-sm px-4"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal overlay popup for Confirm Clear Form */}
      {showClearConfirmModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title text-danger fw-bold d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i> Clear Invoice Form
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowClearConfirmModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body py-3">
                <p className="mb-0">
                  Are you sure you want to clear all form fields? This will discard all of your current inputs and restore the defaults.
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button 
                  type="button" 
                  onClick={() => setShowClearConfirmModal(false)} 
                  className="btn btn-light border btn-sm px-3"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    executeClearForm();
                    setShowClearConfirmModal(false);
                  }} 
                  className="btn btn-danger btn-sm px-3"
                >
                  Clear Form
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
                  onClick={handleClosePreview} 
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
                  onClick={handleClosePreview} 
                  className="btn btn-secondary btn-sm px-4"
                >
                  Close & Go to History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
