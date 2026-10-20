export const channelCreatorUid = channel => channel?.creatorUid || channel?.createdBy || '';

export function activeChannelMembers(channel) {
  const active = Array.isArray(channel?.memberUids) ? new Set(channel.memberUids) : null;
  return [...new Map((channel?.members || []).filter(member => member.uid && (!active || active.has(member.uid))).map(member => [member.uid, member])).values()];
}

export function channelMemberUids(channel) {
  return [...new Set((channel?.members || []).map(member => member.uid).filter(Boolean))];
}

export function canManageChannel(channel, uid) {
  if (!uid) return false;
  if (channelCreatorUid(channel) === uid) return true;
  if (Array.isArray(channel?.adminUids)) return channel.memberUids?.includes(uid) && channel.adminUids.includes(uid);
  return (channel?.members || []).some(member => member.uid === uid && member.isAdmin === true);
}

export function channelAccessFields(channel) {
  const memberUids = channelMemberUids(channel);
  const creator = channelCreatorUid(channel);
  return {
    memberUids,
    adminUids: memberUids.filter(uid => uid === creator || channel.members.some(member => member.uid === uid && member.isAdmin === true)),
    membersCount: channel.members.length
  };
}

export function changeChannelMember(channel, targetUid, action) {
  const target = channel.members?.find(member => member.uid === targetUid);
  if (!target) throw new Error('This student is no longer a channel member.');
  if (targetUid === channelCreatorUid(channel)) throw new Error('The channel creator cannot be removed or demoted.');
  if (!['kick', 'ban', 'promote', 'demote'].includes(action)) throw new Error('Unknown member action.');
  const members = action === 'kick' || action === 'ban'
    ? channel.members.filter(member => member.uid !== targetUid)
    : channel.members.map(member => member.uid === targetUid ? { ...member, isAdmin: action === 'promote' } : member);
  const changed = { ...channel, members };
  return {
    members,
    ...channelAccessFields(changed),
    ...(action === 'ban' ? { bannedMembers: [...new Set([...(channel.bannedMembers || []), targetUid])] } : {})
  };
}
