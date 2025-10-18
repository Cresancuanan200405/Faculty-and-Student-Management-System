import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

export default function Profile() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [user, setUser] = useState(null);
	const [profileImage, setProfileImage] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);
	const [showImageModal, setShowImageModal] = useState(false);
	const fileInputRef = useRef(null);
	const [form, setForm] = useState({
		name: '',
		gender: '',
		birth_date: '',
		nationality: '',
		civil_status: '',
		phone: '',
		email: '',
		address: '',
	});

	const nationalities = [
		'Filipino', 'American', 'Japanese', 'Korean', 'Chinese', 'British', 'Canadian', 'Australian',
		'German', 'French', 'Italian', 'Spanish', 'Indian', 'Thai', 'Vietnamese', 'Malaysian',
		'Singaporean', 'Indonesian', 'Brazilian', 'Mexican', 'Russian', 'Dutch', 'Swedish',
		'Norwegian', 'Danish', 'Swiss', 'Austrian', 'Belgian', 'Portuguese', 'Other'
	];

	const civilStatuses = [
		'Single', 'Married', 'Divorced', 'Widowed', 'Separated', 'In a Relationship'
	];

	useEffect(() => {
		const token = localStorage.getItem('token') || sessionStorage.getItem('token');
		if (token) {
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
		}
		axios.get('/api/me')
			.then(({ data }) => {
				setUser(data);
				setForm({
					name: data.name || '',
					gender: data.gender || '',
					birth_date: data.birth_date || '',
					nationality: data.nationality || '',
					civil_status: data.civil_status || '',
					phone: data.phone || '',
					email: data.email || '',
					address: data.address || '',
				});
				// Set profile image if exists
				if (data.profile_image_url) {
					setImagePreview(data.profile_image_url);
				}
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((f) => ({ ...f, [name]: value }));
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setProfileImage(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	const handleImageClick = () => {
		if (imagePreview) {
			setShowImageModal(true);
		} else {
			triggerFileInput();
		}
	};

	const closeImageModal = () => {
		setShowImageModal(false);
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		try {
			const formData = new FormData();
			
			// Append form fields
			Object.keys(form).forEach(key => {
				formData.append(key, form[key]);
			});
			
			// Append profile image if selected
			if (profileImage) {
				formData.append('profile_image', profileImage);
			}

			const { data } = await axios.post('/api/profile', formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			});
			setUser(data.user);
			alert('Profile updated successfully!');
		} catch (err) {
			alert('Failed to update profile: ' + (err.response?.data?.message || err.message));
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <div>Loading...</div>;
	if (!user) return <div>Not authenticated.</div>;

	const isAdmin = user.position === 'System Administrator';

	return (
		<div className="profile-root">
			<div className="profile-card">
				<div className="profile-header">
					<div className="profile-picture-container">
						<div className="profile-picture" onClick={handleImageClick}>
							{imagePreview ? (
								<img src={imagePreview} alt="Profile" />
							) : (
								<div className="profile-picture-placeholder">
									<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
										<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
									</svg>
									<span>Click to Upload</span>
								</div>
							)}
						</div>
						{imagePreview && (
							<button type="button" className="change-photo-btn" onClick={triggerFileInput}>
								<svg viewBox="0 0 24 24" fill="none">
									<path d="M3 16.5v3h3l9-9-3-3-9 9zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
								</svg>
								Change Photo
							</button>
						)}
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleImageChange}
							style={{ display: 'none' }}
						/>
					</div>
					<div className="profile-info">
						<h2>Edit Profile</h2>
						<p>Update your personal information and profile picture</p>
					</div>
				</div>

				<form onSubmit={handleSave} className="profile-form">
					<div className="profile-columns">
						<div className="profile-col">
							<h3>Personal Information</h3>
							<label>
								Name
								<input name="name" value={form.name} onChange={handleChange} required />
							</label>
							<label>
								Gender
								<select name="gender" value={form.gender} onChange={handleChange} required={isAdmin}>
									<option value="">Select Gender</option>
									<option value="Male">Male</option>
									<option value="Female">Female</option>
								</select>
							</label>
							<label>
								Birth Date
								<input name="birth_date" type="date" value={form.birth_date || ''} onChange={handleChange} required={isAdmin} />
							</label>
							<label>
								Nationality
								<select name="nationality" value={form.nationality} onChange={handleChange} required={isAdmin}>
									<option value="">Select Nationality</option>
									{nationalities.map(nationality => (
										<option key={nationality} value={nationality}>{nationality}</option>
									))}
								</select>
							</label>
							<label>
								Civil Status
								<select name="civil_status" value={form.civil_status} onChange={handleChange} required={isAdmin}>
									<option value="">Select Civil Status</option>
									{civilStatuses.map(status => (
										<option key={status} value={status}>{status}</option>
									))}
								</select>
							</label>
						</div>
						<div className="profile-col">
							<h3>Contact & Address</h3>
							<label>
								Phone Number
								<input name="phone" value={form.phone} onChange={handleChange} required={isAdmin} />
							</label>
							<label>
								Email Address
								<input name="email" type="email" value={form.email} onChange={handleChange} />
							</label>
							<label>
								Address
								<input name="address" value={form.address} onChange={handleChange} required={isAdmin} />
							</label>
						</div>
						<div className="profile-col">
							<h3>Employment & System Info</h3>
							<label>
								Position
								<input value={user.position || ''} readOnly />
							</label>
							<label>
								Employee ID
								<input value={user.employee_id || ''} readOnly />
							</label>
							<div className="profile-last-login">
								<strong>Last Login</strong>
								<div>{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '—'}</div>
							</div>
						</div>
					</div>
					<div className="profile-actions">
						<button type="submit" disabled={saving}>
							{saving ? 'Updating Profile…' : 'Update Profile'}
						</button>
					</div>
				</form>
			</div>

			{/* Image Modal */}
			{showImageModal && imagePreview && (
				<div className="image-modal-overlay" onClick={closeImageModal}>
					<div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
						<button className="image-modal-close" onClick={closeImageModal}>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
								<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</button>
						<img src={imagePreview} alt="Profile Preview" />
					</div>
				</div>
			)}
		</div>
	);
}
