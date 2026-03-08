import { BulbOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { ThemeMode } from '../types';

interface Props {
	value: ThemeMode;
	onChange: (mode: ThemeMode) => void;
}

const labels: Record<ThemeMode, string> = {
	system: 'מערכת',
	light: 'בהיר',
	dark: 'כהה',
};

export function ThemeModeMenu({ value, onChange }: Props) {
	const items: MenuProps['items'] = (Object.keys(labels) as ThemeMode[]).map((mode) => ({
		key: mode,
		label: labels[mode],
	}));

	return (
		<Dropdown
			menu={{
				items,
				selectable: true,
				selectedKeys: [value],
				onClick: ({ key }) => onChange(key as ThemeMode),
			}}
			trigger={['click']}
		>
			<Button icon={<BulbOutlined />} aria-label="בחירת מצב תצוגה">
				מצב: {labels[value]}
			</Button>
		</Dropdown>
	);
}
