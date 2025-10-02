
import React, { useState } from 'react';

const Departments = () => {
	const [department, setDepartment] = useState('');
	const handleSubmit = (e) => {
		e.preventDefault();
		alert(`Department submitted: ${department}`);
		setDepartment('');
	};
	return (
		<div>
			<h2>Departments</h2>
			<form onSubmit={handleSubmit} style={{maxWidth: 400}}>
				<div className="mb-3">
					<label className="form-label">Department Name</label>
					<input type="text" className="form-control" value={department} onChange={e => setDepartment(e.target.value)} required />
				</div>
				<button type="submit" className="btn btn-primary">Submit</button>
			</form>
		</div>
	);
};

export default Departments;
