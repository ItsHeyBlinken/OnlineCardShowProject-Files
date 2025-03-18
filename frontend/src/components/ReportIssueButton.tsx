import React, { useState, useRef } from 'react';
import axios from 'axios';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ReportIssueButtonProps {
  variant?: 'primary' | 'secondary' | 'small';
  className?: string;
  userId: string;
  userName: string;
  userEmail: string;
}

const ReportIssueButton: React.FC<ReportIssueButtonProps> = ({
  variant = 'primary',
  className = '',
  userId,
  userName,
  userEmail
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [priority, setPriority] = useState('Medium');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const openModal = () => {
    setIsModalOpen(true);
    // Reset form
    setSubject('');
    setMessage('');
    setCategory('General Inquiry');
    setPriority('Medium');
    setAttachment(null);
    setErrorMessage('');
    setSuccessMessage('');
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('File size exceeds 5MB limit.');
        e.target.value = '';
        return;
      }
      
      setAttachment(file);
      setErrorMessage('');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!subject.trim()) {
      setErrorMessage('Please enter a subject.');
      return;
    }
    
    if (!message.trim()) {
      setErrorMessage('Please describe your issue.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('message', message);
      formData.append('category', category);
      formData.append('priority', priority);
      
      if (attachment) {
        formData.append('attachment', attachment);
      }
      
      const response = await axios.post('/api/report-issue', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccessMessage('Your issue has been reported successfully! We\'ll get back to you soon.');
      
      // Clear form after 3 seconds and close modal
      setTimeout(() => {
        setSubject('');
        setMessage('');
        setCategory('General Inquiry');
        setPriority('Medium');
        setAttachment(null);
        setSuccessMessage('');
        closeModal();
      }, 3000);
      
    } catch (error) {
      console.error('Error reporting issue:', error);
      setErrorMessage('Failed to report your issue. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md';
      case 'secondary':
        return 'border border-red-600 text-red-600 hover:bg-red-50 font-medium py-2 px-4 rounded-md';
      case 'small':
        return 'bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded-md';
      default:
        return 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md';
    }
  };
  
  return (
    <>
      <button
        onClick={openModal}
        className={`flex items-center ${getButtonStyles()} ${className}`}
      >
        <ExclamationTriangleIcon className="h-5 w-5 mr-1" />
        Report an Issue
      </button>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Report an Issue</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {successMessage ? (
              <div className="bg-green-50 p-4 rounded-md mb-4">
                <p className="text-green-800">{successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {errorMessage && (
                  <div className="bg-red-50 p-3 rounded-md mb-4">
                    <p className="text-red-700 text-sm">{errorMessage}</p>
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Payment Problem">Payment Problem</option>
                    <option value="Account Issue">Account Issue</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px]"
                    placeholder="Please provide details about your issue..."
                    required
                  ></textarea>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachment (optional)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm"
                    >
                      Choose File
                    </button>
                    <span className="ml-3 text-sm text-gray-500">
                      {attachment ? attachment.name : 'No file chosen'}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Max. file size: 5MB. Accepted formats: Images, PDF, Word, Text
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mr-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 ${
                      isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReportIssueButton; 