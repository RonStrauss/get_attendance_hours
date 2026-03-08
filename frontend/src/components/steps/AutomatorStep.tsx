import { Form, Input, Select } from 'antd';
import { automatorOptions } from '../../constants';
import { FormValues } from '../../types';

export function AutomatorStep() {
	return (
		<>
			<Form.Item<FormValues>
				label="בחירת יעד"
				name="AUTOMATION_TARGET"
				rules={[{ required: true, message: 'בחר יעד אוטומציה' }]}
			>
				<Select options={automatorOptions} />
			</Form.Item>
			<Form.Item<FormValues>
				label="שם משתמש"
				name="AUTOMATOR_USERNAME"
				rules={[{ required: true, message: 'הכנס שם משתמש' }]}
			>
				<Input autoComplete="username" />
			</Form.Item>
			<Form.Item<FormValues>
				label="סיסמה"
				name="AUTOMATOR_PASSWORD"
				rules={[{ required: true, message: 'הכנס סיסמה' }]}
			>
				<Input.Password autoComplete="current-password" />
			</Form.Item>
		</>
	);
}
