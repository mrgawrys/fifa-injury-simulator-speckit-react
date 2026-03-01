interface TeamListItemProps {
  teamName: string;
  onClick: () => void;
}

export default function TeamListItem({ teamName, onClick }: TeamListItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-lg bg-gray-800 hover:bg-blue-700 active:bg-blue-600 transition-colors text-white font-medium"
    >
      {teamName}
    </button>
  );
}
