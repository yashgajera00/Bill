import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import settingsAPI from '../services/settingsAPI';

export default function Settings({ triggerAlert }) {
  const [formData, setFormData] = useState({
    company_name: '',
    phone: '',
    address: '',
    gst_number: '',
    state_code: '24-GJ',
    pan_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    terms_conditions: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsAPI.get();
        if (data) {
          setFormData({
            company_name: data.company_name || '',
            phone: data.phone || '',
            address: data.address || '',
            gst_number: data.gst_number || '',
            state_code: data.state_code || '24-GJ',
            pan_number: data.pan_number || '',
            bank_name: data.bank_name || '',
            account_number: data.account_number || '',
            ifsc_code: data.ifsc_code || '',
            terms_conditions: data.terms_conditions || ''
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        triggerAlert('Error loading settings from server.', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.save(formData);
      triggerAlert('Company settings saved successfully.', 'success');
      navigate('/create-invoice');
    } catch (err) {
      console.error('Failed to save settings:', err);
      triggerAlert(err.response?.data?.error || 'Error saving settings.', 'danger');
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
    <div className="container-fluid p-0">
      <div className="content-card">
        <h4 className="card-title"><i className="bi bi-gear-fill me-2"></i> Company Settings</h4>
        <p className="text-muted">Configure your company identity, banking details, and default billing terms here. This information will appear on all generated invoices.</p>
        
        <form onSubmit={handleSubmit} className="mt-4">
          <h5 className="border-bottom pb-2 mb-3 text-primary">Company Identity</h5>
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-12">
              <label className="form-label font-monospace small uppercase fw-bold text-muted">Company Name</label>
              <input
                type="text"
                name="company_name"
                className="form-control"
                value={formData.company_name}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>
            <div className="col-md-6 col-12">
              <label className="form-label font-monospace small uppercase fw-bold text-muted">Phone Number</label>
              <input
                type="text"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>
            <div className="col-12">
              <label className="form-label font-monospace small uppercase fw-bold text-muted">Address</label>
              <textarea
                name="address"
                className="form-control"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>
          </div>

          <h5 className="border-bottom pb-2 mb-3 text-primary">GST & Tax Identifiers</h5>
          <div className="row g-3 mb-4">
            <div className="col-md-4 col-12">
              <label className="form-label font-monospace small uppercase fw-bold text-muted">GST Number</label>
              <input
                type="text"
                name="gst_number"
                className="form-control"
                value={formData.gst_number}
                onChange={handleChange}
                required
                maxLength="15"
                disabled={saving}
              />
            </div>
            <div className="col-md-4 col-12">
              <label className="form-label font-monospace small uppercase fw-bold text-muted">State Code</label>
              <input
                type="text"
                name="state_code"
                className="form-control"
                value={formData.state_code}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>
            <div className="col-md-4 col-12">
              <label className="form-label font-monospace small uppercase fw-bold text-muted">PAN Number</label>
              <input
                type="text"
                name="pan_number"
                className="form-control"
                value={formData.pan_number}
                onChange={handleChange}
                required
                maxLength="10"
                disabled={saving}
              />
            </div>
          </div>

          <h5 className="border-bottom pb-2 mb-3 text-primary">Banking Information</h5>
          <div className="row g-3 mb-4">
            <div className="col-md-4 col-12">
              <label className="form-label font-monospace small uppercase fw-bold text-muted">Bank Name</label>
              <input
                type="text"
                name="bank_name"
                className="form-control"
                value={formData.bank_name}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>
            <div className="col-md-4 col-12">
              <label className="form-label font-monospace small uppercase fw-bold text-muted">Account Number</label>
              <input
                type="text"
                name="account_number"
                className="form-control"
                value={formData.account_number}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>
            <div className="col-md-4 col-12">
              <label className="form-label font-monospace small uppercase fw-bold text-muted">IFSC Code</label>
              <input
                type="text"
                name="ifsc_code"
                className="form-control"
                value={formData.ifsc_code}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>
          </div>

          <h5 className="border-bottom pb-2 mb-3 text-primary">Terms & Conditions</h5>
          <div className="row g-3 mb-4">
            <div className="col-12">
              <label className="form-label font-monospace small uppercase fw-bold text-muted">Terms & Conditions (One per line)</label>
              <textarea
                name="terms_conditions"
                className="form-control"
                rows="5"
                value={formData.terms_conditions}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button 
              type="button" 
              onClick={() => navigate('/create-invoice')} 
              className="btn btn-light border"
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving Changes...
                </>
              ) : (
                <>
                  <i className="bi bi-save me-1"></i> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
