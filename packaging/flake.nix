{
  description = "RDD - README Document generator from CRD";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachSystem [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ] (system:
      let
        pkgs = import nixpkgs { inherit system; };
        
        version = "0.1.0"; #version - This line is replaced by CI
        
        # Map Nix system names to our release asset names
        systemMap = {
          "x86_64-linux" = "x86_64-linux";
          "aarch64-linux" = "aarch64-linux";
          "x86_64-darwin" = "x86_64-darwin";
          "aarch64-darwin" = "aarch64-darwin";
        };
        
        assetName = "rdd-${version}-${systemMap.${system}}.tar.gz";
        
        # Hashes for each platform (will be updated by CI)
        hashes = {
          "x86_64-linux" = {
            hash = "sha256-gLwyuZ3Sv323jBoa80C36RzV4v7WrqXREagCT4bRlXw="; #x86_64-linux - This line is replaced by CI
          };
          "aarch64-linux" = {
            hash = "sha256-+M+Vm4+2kso/M1i86LjmTHdGiv4OfaR0ymUrdAk4TYg="; #aarch64-linux - This line is replaced by CI
          };
          "x86_64-darwin" = {
            hash = "sha256-rjqyFibFMF6FmbB9oSGhmW4aDYTvkPzKst7yZJifTX8="; #x86_64-darwin - This line is replaced by CI
          };
          "aarch64-darwin" = {
            hash = "sha256-UaLyXG8MsxnTyDML9ItQuKPwyF3u0VGC1Bp4So1ypus="; #aarch64-darwin - This line is replaced by CI
          };
        };
        
      in {
        packages = {
          default = self.packages.${system}.rdd;
          
          rdd = pkgs.stdenvNoCC.mkDerivation {
            pname = "rdd";
            inherit version;

            src = pkgs.fetchurl {
              url = "https://github.com/appthrust/rdd/releases/download/${version}/${assetName}";
              inherit (hashes.${system}) hash;
            };

            nativeBuildInputs = [ pkgs.gnutar pkgs.gzip ];

            unpackPhase = ''
              tar -xzf $src
            '';

            installPhase = ''
              mkdir -p $out/bin
              cp rdd $out/bin/
              chmod +x $out/bin/rdd
            '';

            meta = with pkgs.lib; {
              description = "README Document generator from Kubernetes CRD YAML files";
              homepage = "https://github.com/appthrust/rdd";
              license = licenses.mit;
              maintainers = [ ];
              platforms = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
              mainProgram = "rdd";
            };
          };
        };
        
        # For `nix run`
        apps.default = {
          type = "app";
          program = "${self.packages.${system}.rdd}/bin/rdd";
        };
      }
    );
} 