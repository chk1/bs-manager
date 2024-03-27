import { LocalBPList } from "shared/models/playlists/local-playlist.models";
import { LocalPlaylistsManagerService } from "../services/additional-content/local-playlists-manager.service";
import { IpcService } from "../services/ipc.service";
import { mergeMap, of } from "rxjs";
import { BPList } from "shared/models/playlists/playlist.interface";
import path from "path";
import { LocalMapsManagerService } from "../services/additional-content/maps/local-maps-manager.service";
import { Progression } from "main/helpers/fs.helpers";

const ipc = IpcService.getInstance();

ipc.on("one-click-install-playlist", (args, reply) => {
    const mapsManager = LocalPlaylistsManagerService.getInstance();
    reply(mapsManager.oneClickInstallPlaylist(args));
});

ipc.on("register-playlists-deep-link", (args, reply) => {
    const maps = LocalPlaylistsManagerService.getInstance();
    reply(of(maps.enableDeepLinks()));
});

ipc.on("unregister-playlists-deep-link", (args, reply) => {
    const maps = LocalPlaylistsManagerService.getInstance();
    reply(of(maps.disableDeepLinks()));
});

ipc.on("is-playlists-deep-links-enabled", (args, reply) => {
    const maps = LocalPlaylistsManagerService.getInstance();
    reply(of(maps.isDeepLinksEnabled()));
});

ipc.on("install-playlist", (args, reply) => {
    const playlists = LocalPlaylistsManagerService.getInstance();

    const isLocalBPList = (bpList: BPList): bpList is LocalBPList => {
        return (bpList as LocalBPList).path !== undefined && path.isAbsolute((bpList as LocalBPList).path);
    }

    const playListUrl = (() => {
        if (args.playlist.customData?.syncURL) {
            return args.playlist.customData.syncURL;
        }
        if (isLocalBPList(args.playlist)) {
            return args.playlist.path;
        }
        return undefined;
    })();

    return reply(playlists.downloadPlaylist({
        bpListUrl: playListUrl,
        version: args.version,
        ignoreSongsHashs: args.ignoreSongsHashs,
        dest: (args.playlist as LocalBPList)?.path
    }));

});

ipc.on("get-version-playlists-details", (args, reply) => {
    const playlists = LocalPlaylistsManagerService.getInstance();
    reply(playlists.getVersionPlaylistsDetails(args));
});

ipc.on("delete-playlist", (args, reply) => {
    const playlists = LocalPlaylistsManagerService.getInstance();
    const maps = LocalMapsManagerService.getInstance();
    reply(playlists.deletePlaylistFile(args.bpList).pipe(mergeMap(() => {
        if(args.deleteMaps){
            console.log("ALALALZELALZELAZELA");
            return maps.deleteMapsFromHashs(args.version, args.bpList.songs.map(s => s.hash));
        }
        return of({ current: 0, total: 0 } as Progression);
    })));
});
