import { Link } from 'react-router-dom';
import { Modal } from './Modal';
import { Detail } from './Detail';
import { Text, textClasses } from './Text';
import { MediaType } from '../types';

interface TitleDetailModalProps {
  type: MediaType;
  id: number;
  username?: string;
  fullPagePath: string;
  returnPath?: string;
  onClose: () => void;
}

export function TitleDetailModal({
  type,
  id,
  username,
  fullPagePath,
  returnPath,
  onClose,
}: TitleDetailModalProps) {
  return (
    <Modal onClose={onClose} className="max-w-md flex flex-col max-h-[85vh] overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to={fullPagePath}
            state={returnPath ? { from: returnPath } : undefined}
            className={textClasses('link', 'xs', 'subtle')}
          >
            Open full page ↗
          </Link>
          <Text
            as="button"
            variant="link"
            size="xl"
            color="subtle"
            className="leading-none"
            onClick={onClose}
          >
            ✕
          </Text>
        </div>
        <Detail type={type} id={id} username={username} />
      </div>
    </Modal>
  );
}
