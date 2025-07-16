{
  description = "KARG - Kubernetes API Reference Generator";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ] (system:
      let
        pkgs = import nixpkgs { inherit system; };
        
        version = "0.7.0"; #version - This line is replaced by CI
        
        assetName = "karg-v${version}-${system}.tar.gz";
        
        # Hashes for each platform (will be updated by CI)
        hashes = {
          "x86_64-linux" = {
            hash = "sha256-c9Fp/MM162bUiYbcLtj+3wTN5Cwjji1CO4qiNXy8k3w="; #x86_64-linux - This line is replaced by CI
          };
          "aarch64-linux" = {
            hash = "sha256-XNtC9HJL0mMxIyxeOTf7N/vx6RsYl8lT0hYbaXrR+cA="; #aarch64-linux - This line is replaced by CI
          };
          "x86_64-darwin" = {
            hash = "sha256-PwADWP9GeOcZ6jG1pLVrwtq66TYmMqefxDCcU4fd/OM="; #x86_64-darwin - This line is replaced by CI
          };
          "aarch64-darwin" = {
            hash = "sha256-jyoOJpV18Yd5YdiR0YCmRxfEpoDpwQ6/QQJTb/NJyv4="; #aarch64-darwin - This line is replaced by CI
          };
        };
        
      in {
        packages = {
          default = self.packages.${system}.karg;
          
          karg = pkgs.stdenvNoCC.mkDerivation {
            pname = "karg";
            inherit version;

            src = pkgs.fetchurl {
              url = "https://github.com/suinplayground/distribute-binary-via-devbox/releases/download/v${version}/${assetName}"; #github-url - This line is replaced by CI
              inherit (hashes.${system}) hash;
            };

            nativeBuildInputs = [ pkgs.gnutar pkgs.gzip ];

            unpackPhase = ''
              tar --strip-components=1 -xzf $src
            '';

            installPhase = ''
              mkdir -p $out/bin
              cp karg $out/bin/
              chmod +x $out/bin/karg
            '';

            meta = with pkgs.lib; {
              description = "KARG - Kubernetes API Reference Generator. Generate documentation from Kubernetes CRD YAML files";
              homepage = "https://github.com/suinplayground/distribute-binary-via-devbox"; #github-homepage - This line is replaced by CI
              license = licenses.mit;
              maintainers = [ ];
              platforms = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
              mainProgram = "karg";
            };
          };
        };
        
        # For `nix run`
        apps.default = {
          type = "app";
          program = "${self.packages.${system}.karg}/bin/karg";
        };
      }
    );
} 