
import React, { useState } from 'react';

const Reports = () => {
	const [report, setReport] = useState('');
	const handleSubmit = (e) => {
		e.preventDefault();
		alert(`Report submitted: ${report}`);
		setReport('');
	};
	return (
		<div>
			<h2>Reports</h2>
			<form onSubmit={handleSubmit} style={{maxWidth: 400}}>
				<div className="mb-3">
					<label className="form-label">Report Title</label>
					<input type="text" className="form-control" value={report} onChange={e => setReport(e.target.value)} required />
				</div>
				<button type="submit" className="btn btn-primary">Submit</button>
			</form>
		</div>
	);
};

export default Reports;
